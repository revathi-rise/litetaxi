# SwiftCab

Taxi booking platform monorepo (original branding). See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Status (honest summary)

| Area | State |
|---|---|
| Fare engine + 25 unit tests | ✅ implemented, passing |
| API: OTP auth, refresh rotation, RBAC, rate limits | ✅ implemented, e2e-tested |
| API: locations search, route estimate, vehicle availability, fare estimate | ✅ implemented, e2e-tested (mock providers); OSRM adapter smoke-tested live |
| API: admin pricing versions, vehicle categories, audit log | ✅ implemented, e2e-tested |
| Dev seed (fictional Chennai tariff, 12 simulated drivers) | ✅ |
| Swagger (`/api/docs`, dev only) | ✅ generated from controllers/DTOs (response schemas not yet annotated) |
| Bookings, dispatch, trips, payments, coupons, ratings, support, tracking (WebSocket), reports | ❌ Phase 4–6 |
| TypeORM migrations | ❌ not generated (needs a real Postgres); dev uses pg-mem `synchronize` |
| Redis | ❌ not used yet |
| Admin dashboard (Next.js), Customer app, Driver app (Expo) | ❌ not started |
| Docker | intentionally omitted (requested) |

## Run the API (no Docker, no Postgres needed)

```bash
npm install
cp apps/api/.env.example apps/api/.env   # optional; defaults work for dev
npm run api:dev                          # http://localhost:3001, docs at /api/docs
npm run api:test                         # unit + e2e tests
```

Dev mode uses in-memory Postgres (pg-mem); data resets on restart and is re-seeded.

### Try it

Seeded phones (OTP returned in the response, labelled `DEV_MOCK`; **no SMS is sent**):

| Phone | Role |
|---|---|
| +919000000010 | customer |
| +919000000001 / 02 / 03 | admin / ops_manager / support_agent |

```bash
curl -X POST localhost:3001/api/v1/auth/send-otp -H 'content-type: application/json' -d '{"phone":"+919000000010"}'
curl -X POST localhost:3001/api/v1/auth/verify-otp -H 'content-type: application/json' -d '{"phone":"+919000000010","otp":"<devOtp>"}'
curl -X POST localhost:3001/api/v1/fares/estimate -H "authorization: Bearer <accessToken>" -H 'content-type: application/json' \
  -d '{"pickup":{"lat":13.0827,"lng":80.2755},"dropoff":{"lat":13.0418,"lng":80.2341}}'
```

## Enabling real integrations

- **Real road routes (free, no key):** `ROUTING_PROVIDER=osrm` (public demo server — fair-use only, no SLA). Production: self-host OSRM or implement `RoutingProvider` for Google Routes.
- **Real address search:** `GEO_PROVIDER=nominatim` (usage policy applies; set a proper User-Agent). Production: Google Places or self-hosted.
- **Real PostgreSQL:** `DB_MODE=postgres`, `DATABASE_URL=postgres://…`. Generate migrations first (`typeorm migration:generate`) — not yet done; do not use `DB_SYNCHRONIZE=true` in production.
- **Real SMS:** implement `SmsProvider` (`apps/api/src/auth/auth.service.ts`), bind it in `app.module.ts`, set `OTP_MODE=sms`. The app refuses to start in production with `OTP_MODE=dev` or a weak `JWT_SECRET`.
- **Maps keys:** never place server keys in mobile/web bundles; restrict any client map keys by app ID/referrer and API.

## Known limitations

- Driver availability uses an in-process radius scan over all online drivers (fine for the slice; use PostGIS/Redis GEO at scale).
- Fare estimates are persisted per request (10 min expiry); no cleanup job yet.
- Service zones table exists but zone-based pricing is not wired; city-level only.
- Coupons, outstation/rental *estimate endpoints* are not exposed yet (engine supports them and is unit-tested).
- `npm audit` reports vulnerabilities in dev/transitive dependencies; not yet triaged.
