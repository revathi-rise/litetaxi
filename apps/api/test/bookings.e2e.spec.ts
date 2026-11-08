import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { DATA_SOURCE } from '../src/auth/auth.service';
import { BookingsService, isTerminal, TRANSITIONS } from '../src/bookings/bookings.service';
import { configureApp } from '../src/configure-app';
import {
  Booking, BookingStatus, BookingStatusHistory, DriverAssignmentAttempt, DriverProfile, FareEstimate, TripRecord, User,
} from '../src/database/entities';
import { SEED_PHONES } from '../src/database/seed';

const CENTRAL = { lat: 13.0827, lng: 80.2755, address: 'Chennai Central' }; // real test drivers sit exactly here
const TNAGAR = { lat: 13.0418, lng: 80.2341, address: 'T. Nagar' };
const FAR_NORTH = { lat: 13.3, lng: 80.15 }; // inside the city radius, but no drivers within dispatch range

describe('Booking lifecycle (e2e, in-memory Postgres)', () => {
  let app: INestApplication;
  let http: any;
  let ds: DataSource;
  let svc: BookingsService;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule.register({ env: process.env })] }).compile();
    app = mod.createNestApplication();
    configureApp(app);
    await app.init();
    http = app.getHttpServer();
    ds = app.get(DATA_SOURCE);
    svc = app.get(BookingsService);
  });
  afterAll(async () => { await app.close(); });

  /** Reset shared real drivers and any leftover active bookings between tests. */
  afterEach(async () => {
    await ds.query(`UPDATE bookings SET "isActive" = false, status = 'CANCELLED' WHERE "isActive" = true`);
    await ds.query(`UPDATE driver_assignment_attempts SET status = 'cancelled' WHERE status = 'offered'`);
    await ds.query(`UPDATE driver_profiles SET "onActiveTrip" = false WHERE "isSimulated" = false`);
    await ds.query(`UPDATE driver_profiles SET "isOnline" = false WHERE "isSimulated" = false`);
  });

  type Session = { accessToken: string; user: { id: string } };
  const sessions = new Map<string, Session>();
  async function login(phone: string, role?: string): Promise<Session> {
    if (sessions.has(phone)) return sessions.get(phone)!;
    const s = await request(http).post('/api/v1/auth/send-otp').send({ phone }).expect(200);
    const v = await request(http).post('/api/v1/auth/verify-otp').send({ phone, otp: s.body.devOtp, role }).expect(200);
    sessions.set(phone, v.body);
    return v.body;
  }
  let phoneSeq = 0;
  const newCustomer = () => login(`+9199${String(100000 + phoneSeq++).padStart(8, '0')}`);
  const bearer = (s: Session) => ({ Authorization: `Bearer ${s.accessToken}` });

  async function estimate(c: Session, opts: { pickup?: any; dropoff?: any; pickupAt?: string; code?: string } = {}) {
    const r = await request(http).post('/api/v1/fares/estimate').set(bearer(c)).send({ pickup: opts.pickup ?? CENTRAL, dropoff: opts.dropoff ?? TNAGAR, pickupAt: opts.pickupAt });
    expect(r.status).toBe(200);
    const o = r.body.options.find((x: any) => x.category.code === (opts.code ?? 'mini'));
    return { estimateId: o.estimateId as string, total: o.fare.total as string };
  }
  const book = (c: Session, estimateId: string, key = randomUUID(), paymentMethod = 'cash') =>
    request(http).post('/api/v1/bookings').set(bearer(c)).set('Idempotency-Key', key).send({ estimateId, paymentMethod });

  async function realDrivers() {
    const d1 = await login(SEED_PHONES.driver, 'driver');
    const d2 = await login(SEED_PHONES.driver2, 'driver');
    return { d1, d2 };
  }
  const goOnline = (d: Session) => request(http).post('/api/v1/drivers/availability').set(bearer(d)).send({ online: true });
  const setLoc = (d: Session, p: { lat: number; lng: number }) => request(http).post('/api/v1/drivers/location').set(bearer(d)).send({ lat: p.lat, lng: p.lng });

  /** Create a booking and have the real driver 1 accept it. */
  async function assigned(customer?: Session) {
    const c = customer ?? (await newCustomer());
    const { d1 } = await realDrivers();
    await goOnline(d1).expect(200);
    await setLoc(d1, CENTRAL).expect(200);
    const est = await estimate(c);
    const created = await book(c, est.estimateId).expect(201);
    const id = created.body.booking.id;
    const offers = await request(http).get('/api/v1/drivers/ride-requests').set(bearer(d1)).expect(200);
    expect(offers.body.requests.map((r: any) => r.bookingId)).toContain(id);
    await request(http).post(`/api/v1/drivers/ride-requests/${id}/accept`).set(bearer(d1)).expect(200);
    return { c, d1, id, est };
  }

  describe('state machine', () => {
    it('has no outgoing transitions from terminal states and never skips steps', () => {
      for (const s of [BookingStatus.Completed, BookingStatus.Cancelled, BookingStatus.NoDriver]) {
        expect(isTerminal(s)).toBe(true);
        expect(TRANSITIONS[s]).toEqual([]);
      }
      expect(TRANSITIONS[BookingStatus.Searching]).not.toContain(BookingStatus.InProgress);
      expect(TRANSITIONS[BookingStatus.Assigned]).not.toContain(BookingStatus.Completed);
      expect(TRANSITIONS[BookingStatus.InProgress]).toEqual([BookingStatus.Completed]);
    });
  });

  describe('create booking', () => {
    it('requires an Idempotency-Key, a valid estimate and an enabled payment method', async () => {
      const c = await newCustomer();
      const est = await estimate(c);
      await request(http).post('/api/v1/bookings').set(bearer(c)).send({ estimateId: est.estimateId, paymentMethod: 'cash' }).expect(400);
      const r = await book(c, est.estimateId, randomUUID(), 'upi').expect(422);
      expect(r.body.code).toBe('PAYMENT_METHOD_UNAVAILABLE');
      await book(c, randomUUID()).expect(404); // unknown estimate id
    });

    it('creates a booking with a reference, snapshots pricing version and keeps estimated fare separate from final', async () => {
      const c = await newCustomer();
      const est = await estimate(c);
      const r = await book(c, est.estimateId).expect(201);
      const b = r.body.booking;
      expect(b.reference).toMatch(/^SC\d{6}-[A-Z0-9]{6}$/);
      expect(b.estimated.total).toBe(est.total);
      expect(b.final).toBeNull();
      const row = await ds.getRepository(Booking).findOneByOrFail({ id: b.id });
      const e = await ds.getRepository(FareEstimate).findOneByOrFail({ id: est.estimateId });
      expect(row.pricingVersionId).toBe(e.pricingVersionId);
      expect(row.pricingRuleId).toBe(e.pricingRuleId);
    });

    it('is idempotent: same key returns the same booking, even when raced', async () => {
      const c = await newCustomer();
      const est = await estimate(c);
      const key = randomUUID();
      const [a, b] = await Promise.all([book(c, est.estimateId, key), book(c, est.estimateId, key)]);
      expect([a.status, b.status].every((s) => s === 201)).toBe(true);
      expect(a.body.booking.id).toBe(b.body.booking.id);
      const c2 = await book(c, est.estimateId, key).expect(201);
      expect(c2.body.replayed).toBe(true);
      expect(await ds.getRepository(Booking).count({ where: { customerId: c.user.id } })).toBe(1);
    });

    it('prevents duplicate active bookings (even with different keys, and when raced)', async () => {
      const c = await newCustomer();
      const e1 = await estimate(c);
      const e2 = await estimate(c, { code: 'sedan' });
      const results = await Promise.all([book(c, e1.estimateId), book(c, e2.estimateId)]);
      const statuses = results.map((r) => r.status).sort();
      expect(statuses).toEqual([201, 409]);
      expect(await ds.getRepository(Booking).count({ where: { customerId: c.user.id } })).toBe(1);
    });

    it('does not allow booking from another customer\'s estimate', async () => {
      const a = await newCustomer();
      const b = await newCustomer();
      const est = await estimate(a);
      await book(b, est.estimateId).expect(403);
    });

    it('rejects an expired estimate', async () => {
      const c = await newCustomer();
      const est = await estimate(c);
      await ds.getRepository(FareEstimate).update(est.estimateId, { expiresAt: new Date(Date.now() - 1000) });
      const r = await book(c, est.estimateId).expect(410);
      expect(r.body.code).toBe('ESTIMATE_EXPIRED');
    });

    it('marks NO_DRIVER_AVAILABLE when no eligible driver is in range, and the customer can rebook', async () => {
      const c = await newCustomer();
      const est = await estimate(c, { pickup: FAR_NORTH, dropoff: CENTRAL });
      const r = await book(c, est.estimateId).expect(201);
      expect(r.body.booking.status).toBe('NO_DRIVER_AVAILABLE');
      const est2 = await estimate(c);
      await book(c, est2.estimateId).expect(201);
    });
  });

  describe('full lifecycle (manual real-driver flow)', () => {
    it('assign -> arrive -> start (OTP) -> complete -> cash collected, with server-side final fare', async () => {
      const { c, d1, id, est } = await assigned();
      const { d2 } = await realDrivers();

      // customer sees driver + start code; driver-facing views never include the code
      let t = await request(http).get(`/api/v1/bookings/${id}/track`).set(bearer(c)).expect(200);
      expect(t.body.status).toBe('DRIVER_ASSIGNED');
      expect(t.body.driver.name).toBe('Test Driver One');
      expect(t.body.driver.location).toBeTruthy();
      expect(t.body.startOtp).toMatch(/^\d{4}$/);
      const otp = t.body.startOtp;
      const active = await request(http).get('/api/v1/drivers/active-trip').set(bearer(d1)).expect(200);
      expect(active.body.trip.startOtp).toBeNull();

      // another driver cannot act on this trip; arrival requires being near the pickup
      await request(http).post(`/api/v1/trips/${id}/arrive`).set(bearer(d2)).expect(403);
      await setLoc(d1, TNAGAR).expect(200);
      const far = await request(http).post(`/api/v1/trips/${id}/arrive`).set(bearer(d1)).expect(422);
      expect(far.body.code).toBe('TOO_FAR_FROM_PICKUP');
      await setLoc(d1, CENTRAL).expect(200);

      // cannot skip steps
      await request(http).post(`/api/v1/trips/${id}/start`).set(bearer(d1)).send({ otp }).expect(409);
      await request(http).post(`/api/v1/trips/${id}/complete`).set(bearer(d1)).expect(409);
      await request(http).post(`/api/v1/trips/${id}/arrive`).set(bearer(d1)).expect(200);
      await request(http).post(`/api/v1/trips/${id}/arrive`).set(bearer(d1)).expect(409); // replay

      // wrong OTP rejected, correct accepted
      const wrong = otp === '1234' ? '4321' : '1234';
      const bad = await request(http).post(`/api/v1/trips/${id}/start`).set(bearer(d1)).send({ otp: wrong }).expect(400);
      expect(bad.body.code).toBe('OTP_INVALID');
      await request(http).post(`/api/v1/trips/${id}/start`).set(bearer(d1)).send({ otp }).expect(200);

      // GPS samples are recorded during the trip and used for the final distance
      const mid = { lat: (CENTRAL.lat + TNAGAR.lat) / 2, lng: (CENTRAL.lng + TNAGAR.lng) / 2 };
      for (const p of [CENTRAL, mid, TNAGAR]) await setLoc(d1, p).expect(200);

      t = await request(http).get(`/api/v1/bookings/${id}/track`).set(bearer(c)).expect(200);
      expect(t.body.status).toBe('IN_PROGRESS');
      expect(t.body.startOtp).toBeNull();

      const done = await request(http).post(`/api/v1/trips/${id}/complete`).set(bearer(d1)).expect(200);
      expect(done.body.status).toBe('COMPLETED');
      expect(done.body.final.isFinal).toBe(true);
      expect(done.body.estimated.total).toBe(est.total); // estimate preserved separately
      expect(Number(done.body.final.total)).toBeGreaterThan(0);
      expect(done.body.final.breakdown.lines.length).toBeGreaterThan(1);
      expect(done.body.payment.status).toBe('cash_due');

      const trip = await ds.getRepository(TripRecord).findOneByOrFail({ bookingId: id });
      expect(trip.distanceSource).toBe('gps_samples');
      expect(Number(trip.distanceKm)).toBeCloseTo(6.4, 0);

      await request(http).post(`/api/v1/trips/${id}/cash-collected`).set(bearer(d1)).expect(200);
      await request(http).post(`/api/v1/trips/${id}/cash-collected`).set(bearer(d1)).expect(409); // no double collection

      // driver is free again, customer can book again, driver location no longer exposed
      expect((await ds.getRepository(DriverProfile).findOneByOrFail({ userId: d1.user.id })).onActiveTrip).toBe(false);
      t = await request(http).get(`/api/v1/bookings/${id}/track`).set(bearer(c)).expect(200);
      expect(t.body.driver.location).toBeNull();
      expect(t.body.payment.status).toBe('paid');

      const hist = await ds.getRepository(BookingStatusHistory).find({ where: { bookingId: id }, order: { createdAt: 'ASC' } });
      expect(hist.map((h) => h.toStatus)).toEqual(['SEARCHING_DRIVER', 'DRIVER_ASSIGNED', 'DRIVER_ARRIVED', 'IN_PROGRESS', 'COMPLETED']);
    });

    it('locks trip start after repeated wrong OTPs', async () => {
      const { d1, id, c } = await assigned();
      await request(http).post(`/api/v1/trips/${id}/arrive`).set(bearer(d1)).expect(200);
      const t = await request(http).get(`/api/v1/bookings/${id}/track`).set(bearer(c)).expect(200);
      const wrong = t.body.startOtp === '1111' ? '2222' : '1111';
      for (let i = 0; i < 5; i++) await request(http).post(`/api/v1/trips/${id}/start`).set(bearer(d1)).send({ otp: wrong }).expect(400);
      await request(http).post(`/api/v1/trips/${id}/start`).set(bearer(d1)).send({ otp: t.body.startOtp }).expect(429);
    });

    it('a driver cannot hold two active trips and cannot go offline mid-trip', async () => {
      const { d1 } = await assigned();
      const other = await newCustomer();
      const est = await estimate(other);
      await book(other, est.estimateId).expect(201);
      // d1 is busy: they must not receive/accept another request
      const offers = await request(http).get('/api/v1/drivers/ride-requests').set(bearer(d1)).expect(200);
      expect(offers.body.requests).toEqual([]);
      const off = await request(http).post('/api/v1/drivers/availability').set(bearer(d1)).send({ online: false }).expect(409);
      expect(off.body.code).toBe('ON_ACTIVE_TRIP');
    });

    it('only one driver wins when two accept the same request simultaneously', async () => {
      const c = await newCustomer();
      const { d1, d2 } = await realDrivers();
      await goOnline(d1).expect(200);
      await goOnline(d2).expect(200);
      const est = await estimate(c);
      const id = (await book(c, est.estimateId).expect(201)).body.booking.id;
      const p2 = await ds.getRepository(DriverProfile).findOneByOrFail({ userId: d2.user.id });
      // make sure both drivers hold a live offer (batch size is 1 in tests)
      const p1 = await ds.getRepository(DriverProfile).findOneByOrFail({ userId: d1.user.id });
      for (const p of [p1, p2]) {
        const has = await ds.getRepository(DriverAssignmentAttempt).findOne({ where: { bookingId: id, driverProfileId: p.id } });
        if (!has) await ds.getRepository(DriverAssignmentAttempt).save({ bookingId: id, driverProfileId: p.id, batch: 1, status: 'offered', pickupDistanceKm: 0.1, expiresAt: new Date(Date.now() + 60000), respondedAt: null });
      }
      const [a, b] = await Promise.all([
        request(http).post(`/api/v1/drivers/ride-requests/${id}/accept`).set(bearer(d1)),
        request(http).post(`/api/v1/drivers/ride-requests/${id}/accept`).set(bearer(d2)),
      ]);
      expect([a.status, b.status].sort()).toEqual([200, 409]);
      const busy = await ds.getRepository(DriverProfile).find({ where: { onActiveTrip: true, isSimulated: false } });
      expect(busy.length).toBe(1); // loser's claim was released
    });
  });

  describe('dispatch', () => {
    it('re-offers to the next driver when a driver rejects, and when an offer times out', async () => {
      const c = await newCustomer();
      const { d1 } = await realDrivers();
      await goOnline(d1).expect(200);
      const est = await estimate(c);
      const id = (await book(c, est.estimateId).expect(201)).body.booking.id;
      const repo = ds.getRepository(DriverAssignmentAttempt);
      let attempts = await repo.find({ where: { bookingId: id }, order: { batch: 'ASC' } });
      expect(attempts).toHaveLength(1);
      expect(attempts[0].status).toBe('offered');

      // the first offered driver rejects
      const first = await ds.getRepository(DriverProfile).findOneByOrFail({ id: attempts[0].driverProfileId });
      const firstUser = await ds.getRepository(User).findOneByOrFail({ id: first.userId });
      const fs = await login(firstUser.phone, 'driver');
      await request(http).post(`/api/v1/drivers/ride-requests/${id}/reject`).set(bearer(fs)).expect(200);
      attempts = await repo.find({ where: { bookingId: id }, order: { batch: 'ASC' } });
      expect(attempts[0].status).toBe('rejected');
      expect(attempts).toHaveLength(2); // next batch offered
      expect(attempts[1].driverProfileId).not.toBe(attempts[0].driverProfileId);
      await request(http).post(`/api/v1/drivers/ride-requests/${id}/reject`).set(bearer(fs)).expect(409); // can't reject twice

      // the second offer times out -> third batch
      await repo.update({ bookingId: id, status: 'offered' }, { expiresAt: new Date(Date.now() - 1000) });
      await svc.tick();
      attempts = await repo.find({ where: { bookingId: id }, order: { batch: 'ASC' } });
      expect(attempts.map((a) => a.status).slice(0, 2)).toEqual(['rejected', 'timeout']);
      expect(attempts.length).toBe(3);
      const row = await ds.getRepository(Booking).findOneByOrFail({ id });
      expect(row.status).toBe('SEARCHING_DRIVER');
    });

    it('expired offers cannot be accepted', async () => {
      const c = await newCustomer();
      const { d1 } = await realDrivers();
      await goOnline(d1).expect(200);
      const id = (await book(c, (await estimate(c)).estimateId).expect(201)).body.booking.id;
      await ds.getRepository(DriverAssignmentAttempt).update({ bookingId: id }, { expiresAt: new Date(Date.now() - 1000) });
      const r = await request(http).post(`/api/v1/drivers/ride-requests/${id}/accept`).set(bearer(d1));
      expect(r.status).toBe(409);
    });

    it('ends in NO_DRIVER_AVAILABLE after offers are exhausted', async () => {
      const c = await newCustomer();
      const id = (await book(c, (await estimate(c)).estimateId).expect(201)).body.booking.id;
      for (let i = 0; i < 12; i++) {
        await ds.getRepository(DriverAssignmentAttempt).update({ bookingId: id, status: 'offered' }, { expiresAt: new Date(Date.now() - 1000) });
        await svc.tick();
      }
      const row = await ds.getRepository(Booking).findOneByOrFail({ id });
      expect(row.status).toBe('NO_DRIVER_AVAILABLE');
      expect(row.isActive).toBe(false);
    });

    it('driver cancellation returns the booking to the pool and excludes that driver', async () => {
      const { c, d1, id } = await assigned();
      const r = await request(http).post(`/api/v1/trips/${id}/cancel`).set(bearer(d1)).send({ reason: 'vehicle issue' }).expect(200);
      expect(r.body.status).toBe('SEARCHING_DRIVER');
      expect((await ds.getRepository(DriverProfile).findOneByOrFail({ userId: d1.user.id })).onActiveTrip).toBe(false);
      const p1 = await ds.getRepository(DriverProfile).findOneByOrFail({ userId: d1.user.id });
      const attempts = await ds.getRepository(DriverAssignmentAttempt).find({ where: { bookingId: id, driverProfileId: p1.id } });
      expect(attempts).toHaveLength(1);
      expect(attempts[0].status).toBe('cancelled');
      const t = await request(http).get(`/api/v1/bookings/${id}/track`).set(bearer(c)).expect(200);
      expect(t.body.driver).toBeNull();
      expect(t.body.startOtp).toBeNull();
    });
  });

  describe('cancellation', () => {
    it('is free before a driver is assigned', async () => {
      const c = await newCustomer();
      const id = (await book(c, (await estimate(c)).estimateId).expect(201)).body.booking.id;
      const r = await request(http).post(`/api/v1/bookings/${id}/cancel`).set(bearer(c)).send({ reason: 'changed my mind' }).expect(200);
      expect(r.body.status).toBe('CANCELLED');
      expect(r.body.cancellation.fee).toBe('0.00');
      await request(http).post(`/api/v1/bookings/${id}/cancel`).set(bearer(c)).send({}).expect(409); // already cancelled
    });

    it('charges the configured fee after the grace period once a driver is assigned, and frees the driver', async () => {
      const { c, d1, id } = await assigned();
      await ds.getRepository(Booking).update(id, { createdAt: new Date(Date.now() - 10 * 60_000) });
      const r = await request(http).post(`/api/v1/bookings/${id}/cancel`).set(bearer(c)).send({}).expect(200);
      expect(r.body.cancellation.fee).toBe('50.00');
      expect((await ds.getRepository(DriverProfile).findOneByOrFail({ userId: d1.user.id })).onActiveTrip).toBe(false);
    });

    it('is free within the grace window even after assignment', async () => {
      const { c, id } = await assigned();
      const r = await request(http).post(`/api/v1/bookings/${id}/cancel`).set(bearer(c)).send({}).expect(200);
      expect(r.body.cancellation.fee).toBe('0.00');
    });

    it('cannot cancel a trip that is in progress or completed', async () => {
      const { c, d1, id } = await assigned();
      await request(http).post(`/api/v1/trips/${id}/arrive`).set(bearer(d1)).expect(200);
      const otp = (await request(http).get(`/api/v1/bookings/${id}/track`).set(bearer(c))).body.startOtp;
      await request(http).post(`/api/v1/trips/${id}/start`).set(bearer(d1)).send({ otp }).expect(200);
      await request(http).post(`/api/v1/bookings/${id}/cancel`).set(bearer(c)).send({}).expect(409);
    });
  });

  describe('scheduled bookings', () => {
    it('stays SCHEDULED (no offers) until the dispatch window opens', async () => {
      const c = await newCustomer();
      const { d1 } = await realDrivers();
      await goOnline(d1).expect(200);
      const at = new Date(Date.now() + 3 * 3600_000).toISOString();
      const est = await estimate(c, { pickupAt: at });
      const r = await book(c, est.estimateId).expect(201);
      const id = r.body.booking.id;
      expect(r.body.booking.status).toBe('SCHEDULED');
      expect(await ds.getRepository(DriverAssignmentAttempt).count({ where: { bookingId: id } })).toBe(0);
      await svc.tick();
      expect((await ds.getRepository(Booking).findOneByOrFail({ id })).status).toBe('SCHEDULED');
      await ds.getRepository(Booking).update(id, { pickupAt: new Date(Date.now() + 10 * 60_000) });
      await svc.tick();
      expect((await ds.getRepository(Booking).findOneByOrFail({ id })).status).toBe('SEARCHING_DRIVER');
      expect(await ds.getRepository(DriverAssignmentAttempt).count({ where: { bookingId: id } })).toBe(1);
    });
  });

  describe('authorization & privacy', () => {
    it('customers only see their own bookings; drivers/customers are role-separated', async () => {
      const { c, id, d1 } = await assigned();
      const other = await newCustomer();
      await request(http).get(`/api/v1/bookings/${id}/track`).set(bearer(other)).expect(404);
      await request(http).post(`/api/v1/bookings/${id}/cancel`).set(bearer(other)).send({}).expect(404);
      await request(http).get(`/api/v1/bookings/${id}`).set(bearer(d1)).expect(403);
      await request(http).get('/api/v1/drivers/ride-requests').set(bearer(c)).expect(403);
      await request(http).post(`/api/v1/trips/${id}/arrive`).set(bearer(c)).expect(403);
      await request(http).get(`/api/v1/bookings/${id}/track`).expect(401);
    });

    it('lists my bookings and active booking', async () => {
      const { c, id } = await assigned();
      const act = await request(http).get('/api/v1/customers/me/active-booking').set(bearer(c)).expect(200);
      expect(act.body.booking.id).toBe(id);
      const list = await request(http).get('/api/v1/customers/me/bookings').set(bearer(c)).expect(200);
      expect(list.body.total).toBe(1);
      expect(list.body.items[0].id).toBe(id);
    });

    it('staff can inspect bookings with history/attempts (never the trip code); only admin/ops can cancel', async () => {
      const { id } = await assigned();
      const admin = await login(SEED_PHONES.admin);
      const support = await login(SEED_PHONES.support);
      const ops = await login(SEED_PHONES.ops);
      const list = await request(http).get('/api/v1/admin/bookings?status=DRIVER_ASSIGNED').set(bearer(support)).expect(200);
      expect(list.body.items.some((b: any) => b.id === id)).toBe(true);
      const d = await request(http).get(`/api/v1/admin/bookings/${id}`).set(bearer(admin)).expect(200);
      expect(d.body.history.length).toBeGreaterThanOrEqual(2);
      expect(d.body.attempts.length).toBeGreaterThanOrEqual(1);
      expect(d.body.booking.startOtp).toBeUndefined();
      await request(http).post(`/api/v1/admin/bookings/${id}/cancel`).set(bearer(support)).send({}).expect(403);
      const c = await request(http).post(`/api/v1/admin/bookings/${id}/cancel`).set(bearer(ops)).send({ reason: 'ops override' }).expect(200);
      expect(c.body.status).toBe('CANCELLED');
      expect(c.body.cancellation.by).toBe('admin');
      expect(c.body.cancellation.fee).toBe('0.00');
      const cust = await newCustomer();
      await request(http).get('/api/v1/admin/bookings').set(bearer(cust)).expect(403);
    });
  });
});
