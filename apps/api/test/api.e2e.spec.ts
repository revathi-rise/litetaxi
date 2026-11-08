import 'reflect-metadata';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { DATA_SOURCE } from '../src/auth/auth.service';
import { configureApp } from '../src/configure-app';
import { SEED_PHONES } from '../src/database/seed';
import { AuditLog, FareEstimate, PricingVersion } from '../src/database/entities';

const CENTRAL = { lat: 13.0827, lng: 80.2755, address: 'Chennai Central' };
const TNAGAR = { lat: 13.0418, lng: 80.2341, address: 'T. Nagar' };

describe('SwiftCab API (e2e, in-memory Postgres)', () => {
  let app: INestApplication;
  let http: any;
  let ds: DataSource;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule.register({ env: process.env })] }).compile();
    app = mod.createNestApplication();
    configureApp(app);
    await app.init();
    http = app.getHttpServer();
    ds = app.get(DATA_SOURCE);
  });
  afterAll(async () => {
    await app.close();
  });

  type Session = { accessToken: string; refreshToken: string; user: { id: string; role: string }; isNewUser: boolean };
  const sessions = new Map<string, Session>();
  async function login(phone: string, role?: string): Promise<Session> {
    const key = `${phone}:${role ?? ''}`;
    if (sessions.has(key)) return sessions.get(key)!;
    const s = await request(http).post('/api/v1/auth/send-otp').send({ phone }).expect(200);
    const v = await request(http).post('/api/v1/auth/verify-otp').send({ phone, otp: s.body.devOtp, role }).expect(200);
    sessions.set(key, v.body);
    return v.body as Session;
  }
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

  describe('health & auth basics', () => {
    it('health is public', async () => {
      const r = await request(http).get('/api/v1/health').expect(200);
      expect(r.body.db).toBe('ok');
    });
    it('rejects unauthenticated access', async () => {
      await request(http).get('/api/v1/vehicles/available?lat=13&lng=80').expect(401);
    });
    it('rejects forged / malformed tokens', async () => {
      await request(http).get('/api/v1/auth/me').set(auth('abc.def.ghi')).expect(401);
    });
  });

  describe('OTP flow', () => {
    it('labels the dev OTP and rejects invalid phone numbers', async () => {
      await request(http).post('/api/v1/auth/send-otp').send({ phone: '12345' }).expect(400);
      const r = await request(http).post('/api/v1/auth/send-otp').send({ phone: '+919111111111' }).expect(200);
      expect(r.body.provider).toBe('DEV_MOCK');
      expect(r.body.notice).toMatch(/no SMS was sent/i);
    });

    it('rejects a wrong OTP, and an OTP can be used only once', async () => {
      const phone = '+919111111112';
      const s = await request(http).post('/api/v1/auth/send-otp').send({ phone }).expect(200);
      const wrong = s.body.devOtp === '000000' ? '111111' : '000000';
      await request(http).post('/api/v1/auth/verify-otp').send({ phone, otp: wrong }).expect(400);
      await request(http).post('/api/v1/auth/verify-otp').send({ phone, otp: s.body.devOtp }).expect(200);
      await request(http).post('/api/v1/auth/verify-otp').send({ phone, otp: s.body.devOtp }).expect(400);
    });

    it('limits resend frequency and locks after repeated wrong attempts', async () => {
      const phone = '+919111111113';
      const s = await request(http).post('/api/v1/auth/send-otp').send({ phone }).expect(200);
      await request(http).post('/api/v1/auth/send-otp').send({ phone }).expect(429);
      const wrong = s.body.devOtp === '000000' ? '111111' : '000000';
      for (let i = 0; i < 5; i++) await request(http).post('/api/v1/auth/verify-otp').send({ phone, otp: wrong }).expect(400);
      // correct code is now rejected: attempts exhausted
      await request(http).post('/api/v1/auth/verify-otp').send({ phone, otp: s.body.devOtp }).expect(400);
    });

    it('new users get role customer/driver only; staff roles cannot be self-assigned', async () => {
      const c = await login('+919111111114');
      expect(c.user.role).toBe('customer');
      expect(c.isNewUser).toBe(true);
      const d = await login('+919111111115', 'driver');
      expect(d.user.role).toBe('driver');
      const s = await request(http).post('/api/v1/auth/send-otp').send({ phone: '+919111111116' }).expect(200);
      await request(http).post('/api/v1/auth/verify-otp').send({ phone: '+919111111116', otp: s.body.devOtp, role: 'admin' }).expect(400);
    });

    it('rotates refresh tokens and revokes the family on reuse', async () => {
      const t = await login('+919111111117');
      const r1 = await request(http).post('/api/v1/auth/refresh').send({ refreshToken: t.refreshToken }).expect(200);
      expect(r1.body.refreshToken).not.toBe(t.refreshToken);
      // replay of the old (rotated) token -> rejected and family revoked
      await request(http).post('/api/v1/auth/refresh').send({ refreshToken: t.refreshToken }).expect(401);
      await request(http).post('/api/v1/auth/refresh').send({ refreshToken: r1.body.refreshToken }).expect(401);
    });

    it('logout revokes the session', async () => {
      const t = await login('+919111111118');
      await request(http).post('/api/v1/auth/logout').send({ refreshToken: t.refreshToken }).expect(200);
      await request(http).post('/api/v1/auth/refresh').send({ refreshToken: t.refreshToken }).expect(401);
    });
  });

  describe('authorization (backend-enforced)', () => {
    it('customers cannot reach admin endpoints; staff can', async () => {
      const c = await login(SEED_PHONES.customer);
      await request(http).get('/api/v1/admin/pricing-versions').set(auth(c.accessToken)).expect(403);
      const a = await login(SEED_PHONES.admin);
      await request(http).get('/api/v1/admin/pricing-versions').set(auth(a.accessToken)).expect(200);
    });
    it('support agents can read but not change pricing; audit logs are admin-only', async () => {
      const s = await login(SEED_PHONES.support);
      await request(http).get('/api/v1/admin/pricing-versions').set(auth(s.accessToken)).expect(200);
      await request(http).post('/api/v1/admin/pricing-versions').set(auth(s.accessToken)).send({}).expect(403);
      await request(http).get('/api/v1/admin/audit-logs').set(auth(s.accessToken)).expect(403);
    });
    it('drivers cannot call admin APIs', async () => {
      const d = await login('+919111111119', 'driver');
      await request(http).get('/api/v1/admin/cities').set(auth(d.accessToken)).expect(403);
    });
  });

  describe('locations, routes, vehicles', () => {
    let token: string;
    beforeAll(async () => { token = (await login(SEED_PHONES.customer)).accessToken; });

    it('searches landmarks', async () => {
      const r = await request(http).get('/api/v1/locations/search?q=airport').set(auth(token)).expect(200);
      expect(r.body.results[0].name).toMatch(/airport/i);
      await request(http).get('/api/v1/locations/search?q=a').set(auth(token)).expect(400);
    });
    it('route estimate is labelled as mock estimate in dev', async () => {
      const r = await request(http).post('/api/v1/routes/estimate').set(auth(token)).send({ pickup: CENTRAL, dropoff: TNAGAR }).expect(200);
      expect(r.body.source).toBe('mock_estimate');
      expect(r.body.isEstimate).toBe(true);
      expect(r.body.distanceKm).toBeGreaterThan(5);
    });
    it('lists categories with nearby availability from simulated drivers', async () => {
      const r = await request(http).get('/api/v1/vehicles/available?lat=13.0827&lng=80.2707').set(auth(token)).expect(200);
      expect(r.body.categories.length).toBeGreaterThanOrEqual(5);
      expect(r.body.categories.some((c: any) => c.available && c.etaMinutes >= 2)).toBe(true);
    });
  });

  describe('fare estimate', () => {
    let token: string;
    let customerId: string;
    beforeAll(async () => { const l = await login(SEED_PHONES.customer); token = l.accessToken; customerId = l.user.id; });

    it('returns itemised, server-calculated estimates per category, persisted against a pricing version', async () => {
      const r = await request(http).post('/api/v1/fares/estimate').set(auth(token)).send({ pickup: CENTRAL, dropoff: TNAGAR }).expect(200);
      expect(r.body.options.length).toBe(5);
      const mini = r.body.options.find((o: any) => o.category.code === 'mini');
      expect(mini.fare.isFinal).toBe(false);
      expect(mini.fare.label).toBe('Estimated fare');
      expect(mini.fare.lines.length).toBeGreaterThan(2);
      expect(Number(mini.fare.total)).toBeGreaterThanOrEqual(70);
      const sum = mini.fare.lines.reduce((s: number, l: any) => s + Number(l.amount), 0);
      expect(sum).toBeCloseTo(Number(mini.fare.total), 2); // lines add up exactly to total
      const stored = await ds.getRepository(FareEstimate).findOneByOrFail({ id: mini.estimateId });
      expect(stored.pricingVersionId).toBe(r.body.pricingVersionId);
      expect(stored.estimatedTotal).toBe(mini.fare.total);
      expect(stored.customerId).toBe(customerId);
      // premium costs more than mini for the same route
      const prem = r.body.options.find((o: any) => o.category.code === 'premium');
      expect(Number(prem.fare.total)).toBeGreaterThan(Number(mini.fare.total));
    });

    it('never trusts client-submitted fare fields', async () => {
      await request(http).post('/api/v1/fares/estimate').set(auth(token)).send({ pickup: CENTRAL, dropoff: TNAGAR, total: '1.00', fare: 1 }).expect(400);
    });

    it('validates input and handles bad routes / areas', async () => {
      await request(http).post('/api/v1/fares/estimate').set(auth(token)).send({ pickup: CENTRAL, dropoff: CENTRAL }).expect(400); // same place
      await request(http).post('/api/v1/fares/estimate').set(auth(token)).send({ pickup: { lat: 99, lng: 0 }, dropoff: TNAGAR }).expect(400);
      const delhi = { lat: 28.6139, lng: 77.209 };
      const r = await request(http).post('/api/v1/fares/estimate').set(auth(token)).send({ pickup: delhi, dropoff: { lat: 28.62, lng: 77.22 } }).expect(422);
      expect(r.body.code).toBe('OUT_OF_SERVICE_AREA');
      await request(http).post('/api/v1/fares/estimate').set(auth(token)).send({ pickup: CENTRAL, dropoff: TNAGAR, pickupAt: '2020-01-01T00:00:00Z' }).expect(400);
    });

    it('longer trips cost more', async () => {
      const airport = { lat: 12.9941, lng: 80.1709 };
      const short = await request(http).post('/api/v1/fares/estimate').set(auth(token)).send({ pickup: CENTRAL, dropoff: TNAGAR }).expect(200);
      const long = await request(http).post('/api/v1/fares/estimate').set(auth(token)).send({ pickup: CENTRAL, dropoff: airport }).expect(200);
      const t = (b: any) => Number(b.body.options.find((o: any) => o.category.code === 'sedan').fare.total);
      expect(t(long)).toBeGreaterThan(t(short));
    });
  });

  describe('admin pricing versions', () => {
    it('validates, versions, audits, and preserves the version used by earlier estimates', async () => {
      const admin = await login(SEED_PHONES.admin);
      const cust = await login(SEED_PHONES.customer);
      const before = await request(http).post('/api/v1/fares/estimate').set(auth(cust.accessToken)).send({ pickup: CENTRAL, dropoff: TNAGAR }).expect(200);
      const v1 = before.body.pricingVersionId;
      const miniBefore = before.body.options.find((o: any) => o.category.code === 'mini');

      const cities = await request(http).get('/api/v1/admin/cities').set(auth(admin.accessToken)).expect(200);
      const versions = await request(http).get('/api/v1/admin/pricing-versions').set(auth(admin.accessToken)).expect(200);
      const current = versions.body.find((v: any) => v.id === v1);
      const rules = current.rules.map((r: any) => ({ categoryId: r.categoryId, tripType: r.tripType, config: { ...r.config, perKm: String(Number(r.config.perKm) * 2) } }));
      const cityId = cities.body[0].id;

      // invalid config rejected with a list of errors
      const bad = await request(http).post('/api/v1/admin/pricing-versions').set(auth(admin.accessToken)).send({
        cityId, effectiveFrom: new Date(Date.now() - 1000).toISOString(),
        rules: [{ ...rules[0], config: { ...rules[0].config, perKm: '-5', taxPct: '500' } }],
      }).expect(400);
      expect(bad.body.errors.length).toBeGreaterThanOrEqual(2);

      // effective date must be after latest existing version
      await request(http).post('/api/v1/admin/pricing-versions').set(auth(admin.accessToken)).send({ cityId, effectiveFrom: '2025-01-01T00:00:00Z', rules }).expect(400);

      const effectiveFrom = new Date(Date.now() - 1000).toISOString();
      const created = await request(http).post('/api/v1/admin/pricing-versions').set(auth(admin.accessToken)).send({ cityId, effectiveFrom, note: 'double per-km (test)', rules }).expect(201);
      expect(created.body.versionNumber).toBe(2);
      expect(created.body.createdBy).toBe(admin.user.id);

      const after = await request(http).post('/api/v1/fares/estimate').set(auth(cust.accessToken)).send({ pickup: CENTRAL, dropoff: TNAGAR }).expect(200);
      expect(after.body.pricingVersionId).toBe(created.body.id);
      const miniAfter = after.body.options.find((o: any) => o.category.code === 'mini');
      expect(Number(miniAfter.fare.total)).toBeGreaterThan(Number(miniBefore.fare.total));

      // earlier estimate still references (and keeps) v1
      const old = await ds.getRepository(FareEstimate).findOneByOrFail({ id: miniBefore.estimateId });
      expect(old.pricingVersionId).toBe(v1);
      const closed = await ds.getRepository(PricingVersion).findOneByOrFail({ id: v1 });
      expect(closed.effectiveTo).not.toBeNull();

      const logs = await request(http).get('/api/v1/admin/audit-logs').set(auth(admin.accessToken)).expect(200);
      expect(logs.body.some((l: any) => l.action === 'pricing.version.create' && l.actorId === admin.user.id)).toBe(true);
      expect(await ds.getRepository(AuditLog).count()).toBeGreaterThan(0);
    });
  });
});
