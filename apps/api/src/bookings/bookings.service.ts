import {
  BadRequestException, ConflictException, ForbiddenException, HttpException, HttpStatus, Inject, Injectable, NotFoundException,
  OnModuleDestroy, OnModuleInit,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import { DataSource, EntityManager, In, IsNull, LessThanOrEqual } from 'typeorm';
import { DATA_SOURCE } from '../auth/auth.service';
import {
  Booking, BookingStatus, BookingStatusHistory, CustomerProfile, DriverApproval, DriverAssignmentAttempt, DriverLocation, DriverProfile, FareEstimate,
  PricingRule, Role, ServiceCity, TripLocationSample, TripRecord, User, Vehicle, VehicleCategory,
} from '../database/entities';
import { RegisterDriverDto } from '../common/dto';
import { calculateCancellationFee, calculateFare } from '../fares/fare-engine';
import { FaresService } from '../fares/fares.service';
import { haversineKm, LatLng } from '../maps/providers';

export interface BookingConfig {
  batchSize: number;
  maxBatches: number;
  offerTtlMs: number;
  arriveMaxMeters: number;
  tickMs: number; // 0 disables the background ticker (tests call tick() manually)
  scheduleThresholdMin: number; // pickups further out than this become SCHEDULED
  dispatchLeadMin: number; // dispatch starts this long before a scheduled pickup
}
export const BOOKING_CONFIG = Symbol('BOOKING_CONFIG');

export interface Actor {
  id: string | null;
  role: string;
}

const S = BookingStatus;
/** Single source of truth for legal transitions; every status change is validated against it. */
export const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [S.Scheduled]: [S.Searching, S.Cancelled],
  [S.Searching]: [S.Assigned, S.NoDriver, S.Cancelled],
  [S.Assigned]: [S.Arrived, S.Searching, S.Cancelled],
  [S.Arrived]: [S.InProgress, S.Searching, S.Cancelled],
  [S.InProgress]: [S.Completed],
  [S.Completed]: [],
  [S.Cancelled]: [],
  [S.NoDriver]: [],
};
const TERMINAL = [S.Completed, S.Cancelled, S.NoDriver];
export const isTerminal = (s: BookingStatus) => TERMINAL.includes(s);

const err = (status: number, code: string, message: string) => new HttpException({ code, message }, status);
const mins = (a: Date, b: Date) => (b.getTime() - a.getTime()) / 60000;

export type OfferListener = (offer: { bookingId: string; driverProfileId: string }) => void;

@Injectable()
export class BookingsService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private offerListeners: OfferListener[] = [];

  constructor(
    @Inject(DATA_SOURCE) private ds: DataSource,
    @Inject(BOOKING_CONFIG) public readonly cfg: BookingConfig,
    private fares: FaresService,
  ) {}

  onModuleInit() {
    if (this.cfg.tickMs > 0) {
      this.timer = setInterval(() => this.tick().catch(() => undefined), this.cfg.tickMs);
      this.timer.unref?.();
    }
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  onOffer(l: OfferListener) {
    this.offerListeners.push(l);
  }

  /* ------------------------------ state machine ------------------------------ */

  /**
   * Atomically moves a booking between states. The UPDATE is conditional on the current
   * status, so concurrent or replayed requests cannot apply an illegal/duplicate transition.
   */
  async transition(
    m: EntityManager, bookingId: string, from: BookingStatus[], to: BookingStatus, actor: Actor, patch: Partial<Booking> = {}, reason?: string,
  ): Promise<BookingStatus> {
    for (const f of from) {
      if (!TRANSITIONS[f].includes(to)) throw new Error(`Illegal transition table use: ${f} -> ${to}`);
    }
    const current = await m.getRepository(Booking).findOne({ where: { id: bookingId } });
    if (!current) throw new NotFoundException({ code: 'BOOKING_NOT_FOUND', message: 'Booking not found' });
    if (!from.includes(current.status)) {
      throw err(409, 'INVALID_TRANSITION', `Cannot move booking from ${current.status} to ${to}`);
    }
    const res = await m.getRepository(Booking).update(
      { id: bookingId, status: current.status },
      { ...patch, status: to, isActive: !isTerminal(to) },
    );
    if (res.affected === 0) throw err(409, 'INVALID_TRANSITION', 'Booking changed concurrently; retry');
    await m.getRepository(BookingStatusHistory).save({ bookingId, fromStatus: current.status, toStatus: to, actorId: actor.id, actorRole: actor.role, reason: reason ?? null });
    return current.status;
  }

  async getOrFail(id: string): Promise<Booking> {
    const b = await this.ds.getRepository(Booking).findOne({ where: { id } });
    if (!b) throw new NotFoundException({ code: 'BOOKING_NOT_FOUND', message: 'Booking not found' });
    return b;
  }

  /* --------------------------------- create ---------------------------------- */

  private newReference(): string {
    const d = new Date();
    const ymd = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
    return `SC${ymd}-${randomInt(0, 1_000_000).toString(36).toUpperCase().padStart(4, '0')}${randomInt(0, 36 ** 2).toString(36).toUpperCase().padStart(2, '0')}`;
  }

  async create(customerId: string, input: { estimateId: string; paymentMethod: string; idempotencyKey: string }): Promise<{ booking: Booking; replayed: boolean }> {
    const allowedMethods = ['cash', 'razorpay', 'upi', 'card', 'wallet'];
    if (!allowedMethods.includes(input.paymentMethod)) {
      throw err(422, 'PAYMENT_METHOD_UNAVAILABLE', `Payment method must be one of: ${allowedMethods.join(', ')}`);
    }
    const repo = this.ds.getRepository(Booking);
    const existing = await repo.findOne({ where: { customerId, idempotencyKey: input.idempotencyKey } });
    if (existing) return { booking: existing, replayed: true };

    const est: FareEstimate = await this.fares.getEstimate(input.estimateId);
    if (est.customerId && est.customerId !== customerId) throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Estimate belongs to another customer' });
    if (!est.customerId) est.customerId = customerId;
    if (est.expiresAt.getTime() < Date.now()) throw err(410, 'ESTIMATE_EXPIRED', 'Fare estimate expired; please get a new estimate');
    if (est.pickupAt.getTime() < Date.now() - 5 * 60_000) throw err(422, 'PICKUP_IN_PAST', 'Pickup time has passed');

    const city = await this.fares.resolveCity(est.pickup);
    const cat = await this.ds.getRepository(VehicleCategory).findOne({ where: { id: est.categoryId, isActive: true } });
    if (!cat) throw err(422, 'CATEGORY_UNAVAILABLE', 'Vehicle category is no longer available');
    const scheduled = mins(new Date(), est.pickupAt) > this.cfg.scheduleThresholdMin;

    let booking: Booking;
    try {
      booking = await this.ds.transaction(async (m) => {
        const created = await m.getRepository(Booking).save({
          reference: this.newReference(), customerId, idempotencyKey: input.idempotencyKey, estimateId: est.id, categoryId: est.categoryId, cityId: city.id,
          pricingVersionId: est.pricingVersionId, pricingRuleId: est.pricingRuleId, pickup: est.pickup, dropoff: est.dropoff, pickupAt: est.pickupAt,
          status: scheduled ? S.Scheduled : S.Searching, isActive: true, paymentMethod: input.paymentMethod, paymentStatus: 'pending',
          estimatedDistanceKm: est.distanceKm, estimatedDurationMin: est.durationMin, routeGeometry: await this.geometryFor(est), estimatedTotal: est.estimatedTotal,
          finalTotal: null, finalBreakdown: null, driverProfileId: null, vehicleId: null, startOtp: null, startOtpAttempts: 0, cancelledBy: null, cancelReason: null,
          cancellationFee: '0.00', assignedAt: null,
        });
        await m.getRepository(BookingStatusHistory).save({ bookingId: created.id, fromStatus: null, toStatus: created.status, actorId: customerId, actorRole: 'customer', reason: 'booking created' });
        return created;
      });
    } catch (e: any) {
      const msg = String(e?.message ?? '');
      // Concurrent same-key request won the race -> return its booking (idempotent replay)
      const again = await repo.findOne({ where: { customerId, idempotencyKey: input.idempotencyKey } });
      if (again) return { booking: again, replayed: true };
      if (/uq_bookings_one_active|unique/i.test(msg)) {
        if (/estimateId|IDX|estimate/i.test(msg) && !/one_active/i.test(msg)) throw err(409, 'ESTIMATE_ALREADY_USED', 'This estimate has already been booked');
        throw err(409, 'ACTIVE_BOOKING_EXISTS', 'You already have an active booking');
      }
      throw e;
    }
    if (booking.status === S.Searching) await this.offerNextBatch(booking.id);
    return { booking: await this.getOrFail(booking.id), replayed: false };
  }

  private async geometryFor(est: FareEstimate): Promise<[number, number][]> {
    try {
      const r = await this.fares.route(est.pickup, est.dropoff);
      return r.geometry;
    } catch {
      return [[est.pickup.lng, est.pickup.lat], [est.dropoff.lng, est.dropoff.lat]];
    }
  }

  /* --------------------------------- dispatch -------------------------------- */

  /**
   * Simple dispatch v1: offer to the N nearest eligible drivers, one batch at a time.
   * Next batch on reject/timeout. NO_DRIVER_AVAILABLE once batches/candidates are exhausted.
   */
  async offerNextBatch(bookingId: string): Promise<void> {
    const attempts = this.ds.getRepository(DriverAssignmentAttempt);
    const booking = await this.getOrFail(bookingId);
    if (booking.status !== S.Searching) return;

    // expire stale offers
    const open = await attempts.find({ where: { bookingId, status: 'offered' } });
    const now = new Date();
    for (const o of open.filter((x) => x.expiresAt < now)) {
      await attempts.update({ id: o.id, status: 'offered' }, { status: 'timeout', respondedAt: now });
    }
    if (open.some((x) => x.expiresAt >= now)) return; // wait for outstanding offers

    const all = await attempts.find({ where: { bookingId } });
    const batch = Math.max(0, ...all.map((a) => a.batch)) + 1;
    const tried = new Set(all.map((a) => a.driverProfileId));
    const candidates = batch > this.cfg.maxBatches ? [] : (await this.eligibleDrivers(booking)).filter((c) => !tried.has(c.driverProfileId));

    if (!candidates.length) {
      await this.ds.transaction((m) => this.transition(m, bookingId, [S.Searching], S.NoDriver, { id: null, role: 'system' }, {}, 'no drivers available').catch((e) => {
        if (e?.response?.code !== 'INVALID_TRANSITION') throw e; // already moved on (e.g. accepted/cancelled)
        return undefined as any;
      }));
      return;
    }
    const chosen = candidates.slice(0, this.cfg.batchSize);
    const expiresAt = new Date(now.getTime() + this.cfg.offerTtlMs);
    for (const c of chosen) {
      try {
        await attempts.save({ bookingId, driverProfileId: c.driverProfileId, batch, status: 'offered', pickupDistanceKm: c.distanceKm, expiresAt, respondedAt: null });
      } catch {
        continue; // unique (booking, driver) already offered by a racing dispatcher
      }
      for (const l of this.offerListeners) {
        try { l({ bookingId, driverProfileId: c.driverProfileId }); } catch { /* listener errors must not break dispatch */ }
      }
    }
  }

  /** Online, approved, idle, matching-category drivers within radius, nearest first. */
  async eligibleDrivers(booking: Booking): Promise<{ driverProfileId: string; distanceKm: number }[]> {
    const drivers = await this.ds.getRepository(DriverProfile).find({ where: { isOnline: true, onActiveTrip: false, approval: DriverApproval.Approved } });
    if (!drivers.length) return [];
    const ids = drivers.map((d) => d.id);
    const [vehicles, locs] = await Promise.all([
      this.ds.getRepository(Vehicle).find({ where: { driverProfileId: In(ids), categoryId: booking.categoryId, isActive: true } }),
      this.ds.getRepository(DriverLocation).find({ where: { driverProfileId: In(ids) } }),
    ]);
    const okIds = new Set(vehicles.map((v) => v.driverProfileId));
    const driverMap = new Map(drivers.map((d) => [d.id, d]));
    const radius = this.fares['radiusKm'] as number;
    let list = locs
      .filter((l) => okIds.has(l.driverProfileId))
      .map((l) => ({ driverProfileId: l.driverProfileId, distanceKm: haversineKm(booking.pickup, l) }))
      .filter((x) => x.distanceKm <= radius || !(driverMap.get(x.driverProfileId)?.isSimulated ?? true))
      .sort((a, b) => {
        const aSim = driverMap.get(a.driverProfileId)?.isSimulated ?? false;
        const bSim = driverMap.get(b.driverProfileId)?.isSimulated ?? false;
        if (aSim !== bSim) return aSim ? 1 : -1; // Real non-simulated drivers prioritized first
        return a.distanceKm - b.distanceKm;
      });

    // If no driver within radius for demo locations across India, relocate an idle simulated driver
    if (!list.length && okIds.size > 0) {
      const cityDrivers = drivers.filter((d) => d.cityId === booking.cityId);
      const pool = cityDrivers.length ? cityDrivers : drivers;
      const simDriver = pool.find((d) => d.isSimulated && okIds.has(d.id)) || pool.find((d) => okIds.has(d.id));
      if (simDriver) {
        const sgn = () => (Math.random() < 0.5 ? -1 : 1);
        const offsetLat = sgn() * (0.007 + Math.random() * 0.006);
        const offsetLng = sgn() * (0.007 + Math.random() * 0.006);
        const nearLoc = { lat: booking.pickup.lat + offsetLat, lng: booking.pickup.lng + offsetLng };
        await this.ds.getRepository(DriverLocation).update({ driverProfileId: simDriver.id }, nearLoc);
        list = [{ driverProfileId: simDriver.id, distanceKm: haversineKm(booking.pickup, nearLoc) }];
      }
    }
    return list;
  }

  /** Background maintenance: expire offers/re-offer, release due scheduled bookings. Idempotent. */
  async tick(): Promise<void> {
    const repo = this.ds.getRepository(Booking);
    const due = await repo.find({ where: { status: S.Scheduled } });
    for (const b of due) {
      if (mins(new Date(), b.pickupAt) <= this.cfg.dispatchLeadMin) {
        try {
          await this.ds.transaction((m) => this.transition(m, b.id, [S.Scheduled], S.Searching, { id: null, role: 'system' }, {}, 'dispatch window opened'));
        } catch { continue; }
      }
    }
    const searching = await repo.find({ where: { status: S.Searching } });
    for (const b of searching) await this.offerNextBatch(b.id);
  }

  /* ------------------------------ driver actions ------------------------------ */

  async driverProfileFor(userId: string): Promise<DriverProfile> {
    const p = await this.ds.getRepository(DriverProfile).findOne({ where: { userId } });
    if (!p) throw new ForbiddenException({ code: 'NOT_A_DRIVER', message: 'No driver profile' });
    return p;
  }
  private assertApproved(p: DriverProfile) {
    if (p.approval !== DriverApproval.Approved) throw err(403, 'DRIVER_NOT_APPROVED', 'Driver account is not approved');
  }

  async setAvailability(profileId: string, online: boolean) {
    const p = await this.ds.getRepository(DriverProfile).findOneOrFail({ where: { id: profileId } });
    this.assertApproved(p);
    if (!online && p.onActiveTrip) throw err(409, 'ON_ACTIVE_TRIP', 'Finish the active trip before going offline');
    if (online) {
      const loc = await this.ds.getRepository(DriverLocation).findOne({ where: { driverProfileId: p.id } });
      if (!loc) throw err(422, 'LOCATION_REQUIRED', 'Share your location before going online');
    }
    await this.ds.getRepository(DriverProfile).update(p.id, { isOnline: online });
    return { online };
  }

  async updateLocation(profileId: string, loc: { lat: number; lng: number; heading?: number }) {
    const repo = this.ds.getRepository(DriverLocation);
    const existing = await repo.findOne({ where: { driverProfileId: profileId } });
    if (existing) await repo.update(existing.id, { lat: loc.lat, lng: loc.lng, heading: loc.heading ?? null });
    else await repo.save({ driverProfileId: profileId, lat: loc.lat, lng: loc.lng, heading: loc.heading ?? null });
    // Samples are recorded only while a trip is in progress (data minimisation).
    const active = await this.ds.getRepository(Booking).findOne({ where: { driverProfileId: profileId, status: S.InProgress } });
    if (active) await this.ds.getRepository(TripLocationSample).save({ bookingId: active.id, lat: loc.lat, lng: loc.lng, recordedAt: new Date() });
    return { ok: true };
  }

  async openOffers(profileId: string) {
    const now = new Date();
    const offers = await this.ds.getRepository(DriverAssignmentAttempt).find({ where: { driverProfileId: profileId, status: 'offered' } });
    const live = offers.filter((o) => o.expiresAt >= now);
    const out = [];
    for (const o of live) {
      const b = await this.ds.getRepository(Booking).findOne({ where: { id: o.bookingId } });
      if (!b || b.status !== S.Searching) continue;
      const cat = await this.ds.getRepository(VehicleCategory).findOne({ where: { id: b.categoryId } });
      out.push({
        bookingId: b.id, reference: b.reference, category: cat?.name, pickup: b.pickup, dropoff: b.dropoff, pickupDistanceKm: Number(o.pickupDistanceKm.toFixed(2)),
        tripDistanceKm: b.estimatedDistanceKm, estimatedFare: b.estimatedTotal, paymentMethod: b.paymentMethod, expiresAt: o.expiresAt,
      });
    }
    return out;
  }

  async accept(profileId: string, bookingId: string): Promise<Booking> {
    const attempts = this.ds.getRepository(DriverAssignmentAttempt);
    const profile = await this.ds.getRepository(DriverProfile).findOneOrFail({ where: { id: profileId } });
    this.assertApproved(profile);
    const attempt = await attempts.findOne({ where: { bookingId, driverProfileId: profileId } });
    if (!attempt || attempt.status !== 'offered') throw err(409, 'OFFER_NOT_AVAILABLE', 'This ride request is no longer available');
    if (attempt.expiresAt < new Date()) {
      await attempts.update({ id: attempt.id, status: 'offered' }, { status: 'timeout', respondedAt: new Date() });
      throw err(409, 'OFFER_EXPIRED', 'This ride request expired');
    }
    // 1) claim the driver (cannot hold two active trips)
    const claim = await this.ds.getRepository(DriverProfile).update({ id: profileId, onActiveTrip: false, isOnline: true }, { onActiveTrip: true });
    if (claim.affected === 0) throw err(409, 'DRIVER_BUSY', 'You are offline or already on a trip');
    // 2) claim the booking atomically
    try {
      const vehicle = await this.ds.getRepository(Vehicle).findOne({ where: { driverProfileId: profileId, isActive: true } });
      await this.ds.transaction(async (m) => {
        await this.transition(m, bookingId, [S.Searching], S.Assigned, { id: profile.userId, role: 'driver' }, {
          driverProfileId: profileId, vehicleId: vehicle?.id ?? null, startOtp: String(randomInt(1000, 10000)), startOtpAttempts: 0, assignedAt: new Date(),
        }, 'driver accepted');
        await m.getRepository(DriverAssignmentAttempt).update({ id: attempt.id }, { status: 'accepted', respondedAt: new Date() });
        await m.getRepository(DriverAssignmentAttempt).update({ bookingId, status: 'offered' }, { status: 'superseded', respondedAt: new Date() });
        await m.getRepository(TripRecord).save({ bookingId, driverProfileId: profileId, arrivedAt: null, startedAt: null, endedAt: null, distanceKm: null, durationMin: null, waitingMinutes: null, distanceSource: null });
      });
    } catch (e) {
      await this.ds.getRepository(DriverProfile).update(profileId, { onActiveTrip: false }); // release claim
      if (e instanceof HttpException && (e.getResponse() as any).code === 'INVALID_TRANSITION') {
        throw err(409, 'OFFER_NOT_AVAILABLE', 'This ride request is no longer available');
      }
      throw e;
    }
    return this.getOrFail(bookingId);
  }

  async reject(profileId: string, bookingId: string) {
    const attempts = this.ds.getRepository(DriverAssignmentAttempt);
    const res = await attempts.update({ bookingId, driverProfileId: profileId, status: 'offered' }, { status: 'rejected', respondedAt: new Date() });
    if (res.affected === 0) throw err(409, 'OFFER_NOT_AVAILABLE', 'This ride request is no longer available');
    await this.offerNextBatch(bookingId);
    return { ok: true };
  }

  private async ownedByDriver(profileId: string, bookingId: string): Promise<Booking> {
    const b = await this.getOrFail(bookingId);
    if (b.driverProfileId !== profileId) throw new ForbiddenException({ code: 'NOT_YOUR_TRIP', message: 'This trip is not assigned to you' });
    return b;
  }

  async arrive(profileId: string, bookingId: string): Promise<Booking> {
    const b = await this.ownedByDriver(profileId, bookingId);
    const loc = await this.ds.getRepository(DriverLocation).findOne({ where: { driverProfileId: profileId } });
    if (!loc) throw err(422, 'LOCATION_REQUIRED', 'Location unavailable');
    const meters = haversineKm(loc, b.pickup) * 1000;
    if (meters > this.cfg.arriveMaxMeters) throw err(422, 'TOO_FAR_FROM_PICKUP', `You are ${Math.round(meters)} m from the pickup point`);
    await this.ds.transaction(async (m) => {
      await this.transition(m, bookingId, [S.Assigned], S.Arrived, { id: null, role: 'driver' }, {}, 'driver arrived');
      await m.getRepository(TripRecord).update({ bookingId }, { arrivedAt: new Date() });
    });
    return this.getOrFail(bookingId);
  }

  async start(profileId: string, bookingId: string, otp: string): Promise<Booking> {
    const b = await this.ownedByDriver(profileId, bookingId);
    if (b.status !== S.Arrived) throw err(409, 'INVALID_TRANSITION', `Cannot start a trip in status ${b.status}`);
    if (b.startOtpAttempts >= 5) throw err(429, 'OTP_LOCKED', 'Too many wrong codes; contact support');
    if (!b.startOtp || otp !== b.startOtp) {
      await this.ds.getRepository(Booking).update(b.id, { startOtpAttempts: b.startOtpAttempts + 1 });
      throw err(400, 'OTP_INVALID', 'Incorrect trip start code');
    }
    await this.ds.transaction(async (m) => {
      await this.transition(m, bookingId, [S.Arrived], S.InProgress, { id: null, role: 'driver' }, {}, 'trip started (OTP verified)');
      await m.getRepository(TripRecord).update({ bookingId }, { startedAt: new Date() });
    });
    return this.getOrFail(bookingId);
  }

  /**
   * Final fare is recomputed on the server from verified data only:
   *  - duration: server timestamps (start -> end)
   *  - distance: GPS samples recorded server-side if they cover >= 50% of the estimated route, else the estimated route distance
   *  - waiting: server timestamps (arrived -> started)
   * The driver app submits nothing monetary.
   */
  async complete(profileId: string, bookingId: string): Promise<Booking> {
    const b = await this.ownedByDriver(profileId, bookingId);
    if (b.status !== S.InProgress) throw err(409, 'INVALID_TRANSITION', `Cannot complete a trip in status ${b.status}`);
    const trip = await this.ds.getRepository(TripRecord).findOneOrFail({ where: { bookingId } });
    const end = new Date();
    const durationMin = Math.max(1, Math.round(mins(trip.startedAt!, end)));
    const waitingMinutes = trip.arrivedAt && trip.startedAt ? Math.max(0, Math.round(mins(trip.arrivedAt, trip.startedAt))) : 0;

    const samples = await this.ds.getRepository(TripLocationSample).find({ where: { bookingId }, order: { recordedAt: 'ASC' } });
    let gpsKm = 0;
    for (let i = 1; i < samples.length; i++) gpsKm += haversineKm(samples[i - 1], samples[i]);
    const estKm = Number(b.estimatedDistanceKm);
    const useGps = samples.length >= 2 && gpsKm >= estKm * 0.5;
    const distanceKm = useGps ? Math.max(gpsKm, 0) : estKm;

    const rule = await this.ds.getRepository(PricingRule).findOneOrFail({ where: { id: b.pricingRuleId } });
    const city = await this.ds.getRepository(ServiceCity).findOneOrFail({ where: { id: b.cityId } });
    const breakdown = calculateFare(rule.config, {
      tripType: 'city', distanceKm, durationMin: useGps ? durationMin : Math.max(durationMin, 0), pickupAt: trip.startedAt!, timezone: city.timezone, waitingMinutes,
    });

    await this.ds.transaction(async (m) => {
      await this.transition(m, bookingId, [S.InProgress], S.Completed, { id: null, role: 'driver' }, {
        finalTotal: breakdown.total, finalBreakdown: breakdown, paymentStatus: b.paymentMethod === 'cash' ? 'cash_due' : 'pending',
      }, 'trip completed');
      await m.getRepository(TripRecord).update({ bookingId }, {
        endedAt: end, distanceKm: distanceKm.toFixed(2), durationMin: String(durationMin), waitingMinutes: String(waitingMinutes), distanceSource: useGps ? 'gps_samples' : 'estimated_route',
      });
      await m.getRepository(DriverProfile).update(profileId, { onActiveTrip: false });
      await m.getRepository(TripLocationSample).delete({ bookingId }); // stop retaining precise samples once billed (see retention policy)
    });
    return this.getOrFail(bookingId);
  }

  async confirmCash(profileId: string, bookingId: string): Promise<Booking> {
    const b = await this.ownedByDriver(profileId, bookingId);
    if (b.status !== S.Completed) throw err(409, 'INVALID_STATE', 'Trip is not completed');
    const res = await this.ds.getRepository(Booking).update({ id: bookingId, paymentStatus: 'cash_due' }, { paymentStatus: 'paid' });
    if (res.affected === 0) throw err(409, 'NOT_CASH_DUE', 'No cash payment is due for this trip');
    return this.getOrFail(bookingId);
  }

  /** Driver cancels before starting: booking returns to the dispatch pool, excluding this driver. */
  async driverCancel(profileId: string, bookingId: string, reason: string): Promise<Booking> {
    const b = await this.ownedByDriver(profileId, bookingId);
    await this.ds.transaction(async (m) => {
      await this.transition(m, bookingId, [S.Assigned, S.Arrived], S.Searching, { id: null, role: 'driver' }, {
        driverProfileId: null, vehicleId: null, startOtp: null, startOtpAttempts: 0, assignedAt: null,
      }, `driver cancelled: ${reason}`);
      await m.getRepository(DriverAssignmentAttempt).update({ bookingId, driverProfileId: profileId }, { status: 'cancelled', respondedAt: new Date() });
      await m.getRepository(DriverProfile).update(profileId, { onActiveTrip: false });
      await m.getRepository(TripRecord).delete({ bookingId });
    });
    void b;
    await this.offerNextBatch(bookingId);
    return this.getOrFail(bookingId);
  }

  /* ----------------------------- customer actions ----------------------------- */

  async customerCancel(customerId: string, bookingId: string, reason?: string): Promise<Booking> {
    const b = await this.getOrFail(bookingId);
    if (b.customerId !== customerId) throw new NotFoundException({ code: 'BOOKING_NOT_FOUND', message: 'Booking not found' });
    return this.cancel(b, { id: customerId, role: 'customer' }, 'customer', reason);
  }

  async cancel(b: Booking, actor: Actor, by: 'customer' | 'admin', reason?: string): Promise<Booking> {
    if (![S.Scheduled, S.Searching, S.Assigned, S.Arrived].includes(b.status)) {
      throw err(409, 'CANNOT_CANCEL', `A ${b.status} booking cannot be cancelled`);
    }
    const rule = await this.ds.getRepository(PricingRule).findOneOrFail({ where: { id: b.pricingRuleId } });
    const fee = calculateCancellationFee(rule.config, {
      driverAssigned: !!b.driverProfileId, bookedAt: b.createdAt, cancelledAt: new Date(), estimatedTotal: b.estimatedTotal, cancelledBy: by,
    });
    const driverId = b.driverProfileId;
    await this.ds.transaction(async (m) => {
      await this.transition(m, b.id, [S.Scheduled, S.Searching, S.Assigned, S.Arrived], S.Cancelled, actor, {
        cancelledBy: by, cancelReason: reason?.slice(0, 200) ?? null, cancellationFee: fee, paymentStatus: Number(fee) > 0 ? (b.paymentMethod === 'cash' ? 'cash_due' : 'pending') : 'none',
      }, reason ?? 'cancelled');
      await m.getRepository(DriverAssignmentAttempt).update({ bookingId: b.id, status: 'offered' }, { status: 'cancelled', respondedAt: new Date() });
      if (driverId) await m.getRepository(DriverProfile).update(driverId, { onActiveTrip: false });
    });
    return this.getOrFail(b.id);
  }

  /** Customer-facing tracking snapshot. Driver position is shared only while the trip is live. */
  async track(customerId: string, bookingId: string) {
    const b = await this.getOrFail(bookingId);
    if (b.customerId !== customerId) throw new NotFoundException({ code: 'BOOKING_NOT_FOUND', message: 'Booking not found' });
    return this.snapshot(b, true);
  }

  async snapshot(b: Booking, forCustomer: boolean) {
    const live = [S.Assigned, S.Arrived, S.InProgress].includes(b.status);
    let driver: any = null;
    let etaMinutes: number | null = null;
    if (b.driverProfileId && (live || b.status === S.Completed)) {
      const dp = await this.ds.getRepository(DriverProfile).findOne({ where: { id: b.driverProfileId } });
      const veh = b.vehicleId ? await this.ds.getRepository(Vehicle).findOne({ where: { id: b.vehicleId } }) : null;
      const loc = live ? await this.ds.getRepository(DriverLocation).findOne({ where: { driverProfileId: b.driverProfileId } }) : null;
      driver = {
        name: dp?.name, rating: dp?.rating, isSimulated: dp?.isSimulated ?? false,
        vehicle: veh ? { model: veh.model, registrationNumber: veh.registrationNumber, color: veh.color } : null,
        location: loc ? { lat: loc.lat, lng: loc.lng, heading: loc.heading, updatedAt: loc.updatedAt } : null,
      };
      if (loc) {
        const target = b.status === S.InProgress ? b.dropoff : b.pickup;
        if (b.status !== S.Arrived) etaMinutes = FaresService.etaMinutes(haversineKm(loc, target));
      }
    }
    const cat = await this.ds.getRepository(VehicleCategory).findOne({ where: { id: b.categoryId } });
    return {
      id: b.id, reference: b.reference, status: b.status, category: cat ? { code: cat.code, name: cat.name } : null,
      pickup: b.pickup, dropoff: b.dropoff, pickupAt: b.pickupAt, route: b.routeGeometry,
      estimated: { label: 'Estimated fare', isFinal: false, total: b.estimatedTotal, distanceKm: b.estimatedDistanceKm, durationMin: b.estimatedDurationMin },
      final: b.finalTotal ? { label: 'Final fare', isFinal: true, total: b.finalTotal, breakdown: b.finalBreakdown } : null,
      payment: { method: b.paymentMethod, status: b.paymentStatus },
      cancellation: b.status === S.Cancelled ? { by: b.cancelledBy, reason: b.cancelReason, fee: b.cancellationFee } : null,
      driver, etaMinutes,
      // Trip-start code is shown only to the customer, only while it is useful.
      startOtp: forCustomer && (b.status === S.Assigned || b.status === S.Arrived) ? b.startOtp : null,
      createdAt: b.createdAt,
    };
  }

  async activeFor(customerId: string) {
    const b = await this.ds.getRepository(Booking).findOne({ where: { customerId, isActive: true } });
    return b ? this.snapshot(b, true) : null;
  }

  async listForCustomer(customerId: string, page = 1, pageSize = 20) {
    const [rows, total] = await this.ds.getRepository(Booking).findAndCount({
      where: { customerId }, order: { createdAt: 'DESC' }, skip: (Math.max(1, page) - 1) * pageSize, take: Math.min(50, pageSize),
    });
    return {
      total, page,
      items: rows.map((b) => ({
        id: b.id, reference: b.reference, status: b.status, pickup: b.pickup, dropoff: b.dropoff, createdAt: b.createdAt,
        total: b.finalTotal ?? b.estimatedTotal, isFinal: !!b.finalTotal, cancellationFee: b.cancellationFee,
      })),
    };
  }

  /** Driver's currently assigned trip (for app resume after restart). */
  async activeForDriver(profileId: string) {
    const b = await this.ds.getRepository(Booking).findOne({ where: { driverProfileId: profileId, isActive: true } });
    if (!b) return null;
    const snap = await this.snapshot(b, false);
    return { ...snap, startOtp: null };
  }

  /* --------------------------------- admin ---------------------------------- */

  async adminList(q: { status?: string; search?: string; page?: number; pageSize?: number }) {
    const qb = this.ds.getRepository(Booking).createQueryBuilder('b').orderBy('b.createdAt', 'DESC');
    if (q.status) qb.andWhere('b.status = :s', { s: q.status });
    if (q.search) qb.andWhere('b.reference ILIKE :r', { r: `%${q.search.replace(/[%_]/g, '')}%` });
    const pageSize = Math.min(100, q.pageSize ?? 20);
    const page = Math.max(1, q.page ?? 1);
    const [items, total] = await qb.skip((page - 1) * pageSize).take(pageSize).getManyAndCount();
    return { total, page, items };
  }

  async adminDetail(id: string) {
    const b = await this.getOrFail(id);
    const [history, attempts, trip] = await Promise.all([
      this.ds.getRepository(BookingStatusHistory).find({ where: { bookingId: id }, order: { createdAt: 'ASC' } }),
      this.ds.getRepository(DriverAssignmentAttempt).find({ where: { bookingId: id }, order: { offeredAt: 'ASC' } }),
      this.ds.getRepository(TripRecord).findOne({ where: { bookingId: id } }),
    ]);
    const { startOtp, ...safe } = b; // never expose the trip code to staff UIs
    void startOtp;
    return { booking: safe, history, attempts, trip };
  }

  async adminCancel(id: string, actor: Actor, reason: string) {
    return this.cancel(await this.getOrFail(id), actor, 'admin', reason);
  }

  /* ---------------------- driver registration & self ---------------------- */

  async getDriverSelf(userId: string) {
    const dp = await this.ds.getRepository(DriverProfile).findOne({ where: { userId } });
    if (!dp) return { hasProfile: false };
    const user = await this.ds.getRepository(User).findOne({ where: { id: userId } });
    const veh = await this.ds.getRepository(Vehicle).findOne({ where: { driverProfileId: dp.id } });
    const cat = veh ? await this.ds.getRepository(VehicleCategory).findOne({ where: { id: veh.categoryId } }) : null;
    return {
      hasProfile: true,
      profile: {
        ...dp,
        phone: dp.phone || user?.phone,
      },
      vehicle: veh,
      category: cat,
    };
  }

  async getDriverTrips(driverProfileId: string) {
    const bookings = await this.ds.getRepository(Booking).find({
      where: { driverProfileId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    const items = await Promise.all(bookings.map((b) => this.snapshot(b, false)));
    return { trips: items, count: items.length };
  }

  async getDriverWallet(driverProfileId: string) {
    const dp = await this.ds.getRepository(DriverProfile).findOneOrFail({ where: { id: driverProfileId } });
    const completed = await this.ds.getRepository(Booking).find({
      where: { driverProfileId, status: BookingStatus.Completed },
      order: { createdAt: 'DESC' },
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const plan = dp.pricingPlan || 'commission_15';
    const isSubActive = !!(dp.subscriptionExpiresAt && new Date(dp.subscriptionExpiresAt) > new Date());

    const calculateFee = (fare: number) => {
      if (plan === 'daily_sub_29' && isSubActive) return 0; // 0% commission unlimited pass
      if (plan === 'flat_fee_15') return Math.min(fare, 15); // Flat ₹15 per ride
      return fare * 0.15; // Standard 15% commission
    };

    let totalPlatformFee = 0;
    let totalDriverNet = 0;
    let todayDriverNet = 0;

    for (const b of completed) {
      const fare = Number(b.finalTotal || b.estimatedTotal || 0);
      const fee = calculateFee(fare);
      totalPlatformFee += fee;
      totalDriverNet += (fare - fee);
      if (new Date(b.createdAt) >= today) {
        todayDriverNet += (fare - fee);
      }
    }

    const cashCollected = completed
      .filter((b) => b.paymentMethod === 'cash')
      .reduce((sum, b) => sum + Number(b.finalTotal || b.estimatedTotal || 0), 0);

    const baseWallet = Number(dp.walletBalance || 0);
    const walletBalance = Math.max(0, baseWallet + totalDriverNet - cashCollected);

    const recentTransactions = completed.slice(0, 10).map((b) => {
      const fare = Number(b.finalTotal || b.estimatedTotal || 0);
      const fee = calculateFee(fare);
      return {
        id: b.id,
        bookingReference: b.reference,
        date: b.createdAt,
        fare,
        platformFee: Number(fee.toFixed(2)),
        driverShare: Number((fare - fee).toFixed(2)),
        pickup: b.pickup.address || 'Pickup point',
        dropoff: b.dropoff.address || 'Dropoff destination',
        paymentMethod: b.paymentMethod,
      };
    });

    return {
      pricingPlan: plan,
      isSubscriptionActive: isSubActive,
      subscriptionExpiresAt: dp.subscriptionExpiresAt,
      walletBalance: Number(walletBalance.toFixed(2)),
      todayEarnings: Number(todayDriverNet.toFixed(2)),
      totalEarnings: Number(totalDriverNet.toFixed(2)),
      cashCollected: Number(cashCollected.toFixed(2)),
      platformFee: Number(totalPlatformFee.toFixed(2)),
      completedTrips: completed.length,
      todayTripsCount: completed.filter((b) => new Date(b.createdAt) >= today).length,
      recentTransactions,
    };
  }

  async updateDriverPlan(userId: string, plan: string) {
    const dp = await this.driverProfileFor(userId);
    await this.ds.getRepository(DriverProfile).update(dp.id, { pricingPlan: plan });
    return {
      success: true,
      pricingPlan: plan,
      message: `Earnings plan updated to ${plan.replace('_', ' ').toUpperCase()}`,
    };
  }

  async activateSubscriptionFromWallet(userId: string, tier: 'daily_29' | 'monthly_699') {
    const dp = await this.driverProfileFor(userId);
    const cost = tier === 'monthly_699' ? 699 : 29;
    const days = tier === 'monthly_699' ? 30 : 1;
    const currentBalance = Number(dp.walletBalance || 0);

    if (currentBalance < cost) {
      throw new BadRequestException(`Insufficient wallet balance. Recharge ₹${(cost - currentBalance).toFixed(2)} to activate.`);
    }

    const now = new Date();
    const currentExpiry = dp.subscriptionExpiresAt && new Date(dp.subscriptionExpiresAt) > now
      ? new Date(dp.subscriptionExpiresAt)
      : now;
    const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 3600 * 1000);

    const newBalance = (currentBalance - cost).toFixed(2);
    await this.ds.getRepository(DriverProfile).update(dp.id, {
      pricingPlan: 'daily_sub_29',
      subscriptionExpiresAt: newExpiry,
      walletBalance: newBalance,
    });

    return {
      success: true,
      pricingPlan: 'daily_sub_29',
      subscriptionExpiresAt: newExpiry.toISOString(),
      walletBalance: Number(newBalance),
      message: `0% Commission Unlimited Pass activated for ${days} day(s)!`,
    };
  }

  async registerDriver(userId: string, dto: RegisterDriverDto) {
    let user = await this.ds.getRepository(User).findOne({ where: { id: userId } });
    if (!user) {
      user = await this.ds.getRepository(User).save({
        id: userId,
        phone: dto.phone || `+91${Date.now().toString().slice(-10)}`,
        role: Role.Driver,
      });
    }
    let dp = await this.ds.getRepository(DriverProfile).findOne({ where: { userId } });
    const repo = this.ds.getRepository(DriverProfile);

    // Resolve category by ID or by code (e.g. 'auto', 'mini', 'sedan')
    const catRepo = this.ds.getRepository(VehicleCategory);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dto.categoryId);
    let category = isUuid ? await catRepo.findOne({ where: { id: dto.categoryId } }) : null;
    if (!category) {
      category = (await catRepo.findOne({ where: { code: dto.categoryId.toLowerCase() } })) ||
                 (await catRepo.find())[0];
    }

    if (!dp) {
      dp = await repo.save({
        userId,
        name: dto.name,
        email: dto.email ?? null,
        phone: dto.phone ?? user.phone,
        aadhaarNumber: dto.aadhaarNumber,
        aadhaarImageUrl: dto.aadhaarImageUrl ?? null,
        licenseNumber: dto.licenseNumber,
        licenseImageUrl: dto.licenseImageUrl ?? null,
        approval: DriverApproval.Pending, // Initial registration is NOT approved!
        pricingPlan: dto.pricingPlan ?? 'commission_15',
        subscriptionExpiresAt: null,
        walletBalance: '0.00',
        rejectionReason: null,
        isOnline: false,
        onActiveTrip: false,
        rating: '5.00',
        isSimulated: false,
      });
    } else {
      await repo.update(dp.id, {
        name: dto.name,
        email: dto.email ?? dp.email,
        phone: dto.phone ?? dp.phone ?? user.phone,
        aadhaarNumber: dto.aadhaarNumber,
        aadhaarImageUrl: dto.aadhaarImageUrl ?? dp.aadhaarImageUrl,
        licenseNumber: dto.licenseNumber,
        licenseImageUrl: dto.licenseImageUrl ?? dp.licenseImageUrl,
        approval: DriverApproval.Pending, // Re-submitting keeps or resets to pending
        pricingPlan: dto.pricingPlan ?? dp.pricingPlan ?? 'commission_15',
        rejectionReason: null,
      });
      dp = await repo.findOneOrFail({ where: { id: dp.id } });
    }

    // Upsert vehicle
    const vRepo = this.ds.getRepository(Vehicle);
    let veh = await vRepo.findOne({ where: { driverProfileId: dp.id } });
    if (!veh) {
      veh = await vRepo.save({
        driverProfileId: dp.id,
        categoryId: category.id,
        registrationNumber: dto.registrationNumber.toUpperCase(),
        model: dto.model,
        color: dto.color ?? 'White',
        vehicleFrontImageUrl: dto.vehicleFrontImageUrl ?? null,
        vehicleBackImageUrl: dto.vehicleBackImageUrl ?? null,
        vehicleLeftImageUrl: dto.vehicleLeftImageUrl ?? null,
        vehicleRightImageUrl: dto.vehicleRightImageUrl ?? null,
        isActive: true,
      });
    } else {
      await vRepo.update(veh.id, {
        categoryId: category.id,
        registrationNumber: dto.registrationNumber.toUpperCase(),
        model: dto.model,
        color: dto.color ?? veh.color,
        vehicleFrontImageUrl: dto.vehicleFrontImageUrl ?? veh.vehicleFrontImageUrl,
        vehicleBackImageUrl: dto.vehicleBackImageUrl ?? veh.vehicleBackImageUrl,
        vehicleLeftImageUrl: dto.vehicleLeftImageUrl ?? veh.vehicleLeftImageUrl,
        vehicleRightImageUrl: dto.vehicleRightImageUrl ?? veh.vehicleRightImageUrl,
        isActive: true,
      });
      veh = await vRepo.findOneOrFail({ where: { id: veh.id } });
    }

    // Default location fix
    const locRepo = this.ds.getRepository(DriverLocation);
    const loc = await locRepo.findOne({ where: { driverProfileId: dp.id } });
    if (!loc) {
      await locRepo.save({ driverProfileId: dp.id, lat: 10.9619, lng: 76.9806, heading: 0 });
    }

    return {
      success: true,
      status: dp.approval,
      message: 'Driver registration submitted successfully. Pending admin approval.',
      profile: dp,
      vehicle: veh,
      category,
    };
  }

  /* ---------------------- admin portal queries ---------------------- */

  async adminListDrivers(status?: string, search?: string) {
    const qb = this.ds.getRepository(DriverProfile).createQueryBuilder('dp');
    if (status && status !== 'all') {
      qb.andWhere('dp.approval = :status', { status });
    }
    if (search) {
      qb.andWhere('(dp.name ILIKE :s OR dp.email ILIKE :s OR dp.phone ILIKE :s)', { s: `%${search}%` });
    }
    qb.orderBy('dp.createdAt', 'DESC');
    const drivers = await qb.getMany();

    const result = await Promise.all(drivers.map(async (d) => {
      const u = await this.ds.getRepository(User).findOne({ where: { id: d.userId } });
      const veh = await this.ds.getRepository(Vehicle).findOne({ where: { driverProfileId: d.id } });
      const cat = veh ? await this.ds.getRepository(VehicleCategory).findOne({ where: { id: veh.categoryId } }) : null;
      const completedBookings = await this.ds.getRepository(Booking).find({ where: { driverProfileId: d.id, status: BookingStatus.Completed } });
      const totalGross = completedBookings.reduce((sum, b) => sum + Number(b.finalTotal || b.estimatedTotal || 0), 0);
      const netEarnings = Number((totalGross * 0.85).toFixed(2));
      return {
        id: d.id,
        userId: d.userId,
        name: d.name,
        email: d.email,
        phone: d.phone || u?.phone,
        approval: d.approval,
        rejectionReason: d.rejectionReason,
        isOnline: d.isOnline,
        onActiveTrip: d.onActiveTrip,
        rating: d.rating,
        isSimulated: d.isSimulated,
        aadhaarNumber: d.aadhaarNumber,
        aadhaarImageUrl: d.aadhaarImageUrl,
        licenseNumber: d.licenseNumber,
        licenseImageUrl: d.licenseImageUrl,
        totalTrips: completedBookings.length,
        totalEarnings: netEarnings,
        walletBalance: netEarnings,
        createdAt: d.createdAt,
        vehicle: veh ? {
          id: veh.id,
          registrationNumber: veh.registrationNumber,
          model: veh.model,
          color: veh.color,
          categoryName: cat?.name ?? 'Standard',
          vehicleFrontImageUrl: veh.vehicleFrontImageUrl,
          vehicleBackImageUrl: veh.vehicleBackImageUrl,
          vehicleLeftImageUrl: veh.vehicleLeftImageUrl,
          vehicleRightImageUrl: veh.vehicleRightImageUrl,
        } : null,
      };
    }));
    return { drivers: result, total: result.length };
  }

  async adminApproveDriver(driverProfileId: string) {
    const dp = await this.ds.getRepository(DriverProfile).findOneOrFail({ where: { id: driverProfileId } });
    await this.ds.getRepository(DriverProfile).update(driverProfileId, {
      approval: DriverApproval.Approved,
      rejectionReason: null,
    });
    return { success: true, approval: DriverApproval.Approved, message: `Driver ${dp.name} has been approved` };
  }

  async adminRejectDriver(driverProfileId: string, reason?: string) {
    const dp = await this.ds.getRepository(DriverProfile).findOneOrFail({ where: { id: driverProfileId } });
    await this.ds.getRepository(DriverProfile).update(driverProfileId, {
      approval: DriverApproval.Rejected,
      rejectionReason: reason ?? 'Documents rejected by operations team',
      isOnline: false,
    });
    return { success: true, approval: DriverApproval.Rejected, message: `Driver ${dp.name} has been rejected` };
  }

  async adminListCustomers() {
    const customers = await this.ds.getRepository(CustomerProfile).find();
    const result = await Promise.all(customers.map(async (c) => {
      const u = await this.ds.getRepository(User).findOne({ where: { id: c.userId } });
      const bookingCount = await this.ds.getRepository(Booking).count({ where: { customerId: c.userId } });
      return {
        id: c.id,
        userId: c.userId,
        name: c.name ?? 'Guest Customer',
        email: c.email,
        phone: u?.phone ?? '',
        totalBookings: bookingCount,
      };
    }));
    return { customers: result, total: result.length };
  }

  async adminCurrentRides() {
    const activeStatuses = [BookingStatus.Searching, BookingStatus.Assigned, BookingStatus.Arrived, BookingStatus.InProgress];
    const rides = await this.ds.getRepository(Booking).find({
      where: { status: In(activeStatuses) },
      order: { createdAt: 'DESC' },
    });
    const items = await Promise.all(rides.map((b) => this.snapshot(b, false)));
    return { rides: items, count: items.length };
  }

  async adminStats() {
    const [totalBookings, pendingDrivers, approvedDrivers, activeRides, totalCustomers] = await Promise.all([
      this.ds.getRepository(Booking).count(),
      this.ds.getRepository(DriverProfile).count({ where: { approval: DriverApproval.Pending } }),
      this.ds.getRepository(DriverProfile).count({ where: { approval: DriverApproval.Approved } }),
      this.ds.getRepository(Booking).count({ where: { status: In([BookingStatus.Searching, BookingStatus.Assigned, BookingStatus.Arrived, BookingStatus.InProgress]) } }),
      this.ds.getRepository(CustomerProfile).count(),
    ]);

    const completed = await this.ds.getRepository(Booking).find({ where: { status: BookingStatus.Completed } });
    const revenue = completed.reduce((acc, b) => acc + Number(b.finalTotal || b.estimatedTotal || 0), 0);

    return {
      totalBookings,
      activeRides,
      pendingDrivers,
      approvedDrivers,
      totalCustomers,
      totalRevenue: revenue.toFixed(2),
    };
  }
}

export { IsNull, LessThanOrEqual, BadRequestException, ConflictException };
