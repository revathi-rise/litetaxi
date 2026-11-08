import { DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { AdminController, AuthController, FaresController, LocationsController } from './app.controllers';
import { AuthGuard } from './auth/auth.guard';
import { AuthService, DATA_SOURCE, DevMockSmsProvider, OTP_MODE, SMS_PROVIDER } from './auth/auth.service';
import { createDataSource } from './database/data-source';
import { seedDevData } from './database/seed';
import { DISPATCH_RADIUS_KM, FaresService } from './fares/fares.service';
import { HealthController } from './health.controller';
import { BOOKING_CONFIG, BookingsService } from './bookings/bookings.service';
import { AdminBookingsController, AdminPortalController, CustomerBookingsController, DriverController } from './bookings/bookings.controllers';
import { PaymentsController } from './payments/payments.controller';
import { RazorpayService } from './payments/razorpay.service';
import { DriverSimulator, SIM_CONFIG } from './bookings/driver-simulator';
import {
  FallbackRoutingProvider, GEOCODING_PROVIDER, GoogleRoutesProvider, MockGeocodingProvider, MockRoutingProvider, NominatimGeocodingProvider, OsrmRoutingProvider, ROUTING_PROVIDER,
} from './maps/providers';

export interface AppOptions {
  env?: NodeJS.ProcessEnv;
}

@Module({})
export class AppModule {
  static register(opts: AppOptions = {}): DynamicModule {
    const env = opts.env ?? process.env;
    const prod = env.NODE_ENV === 'production';
    const jwtSecret = env.JWT_SECRET;
    if (prod && (!jwtSecret || jwtSecret.length < 32)) throw new Error('JWT_SECRET (>=32 chars) is required in production');
    const otpMode = (env.OTP_MODE ?? 'dev') as 'dev' | 'sms';
    if (prod && otpMode === 'dev') throw new Error('OTP_MODE=dev is not allowed in production');

    return {
      module: AppModule,
      imports: [
        JwtModule.register({ global: true, secret: jwtSecret ?? 'dev-only-insecure-secret-change-me-0000000000' }),
        ThrottlerModule.forRoot([{ ttl: 60_000, limit: Number(env.THROTTLE_LIMIT ?? 120) }]),
      ],
      controllers: [
        AuthController, LocationsController, FaresController, AdminController, HealthController,
        CustomerBookingsController, DriverController, AdminBookingsController, AdminPortalController,
        PaymentsController,
      ],
      providers: [
        RazorpayService,
        {
          provide: DATA_SOURCE,
          useFactory: async (): Promise<DataSource> => {
            const ds = await createDataSource(env);
            // memory mode seeds by default; postgres seeds only when SEED_DEV_DATA=true (idempotent: skips if cities exist)
            const isMemory = (env.DB_MODE ?? 'memory') === 'memory';
            if ((isMemory && env.SEED_DEV_DATA !== 'false') || (!isMemory && env.SEED_DEV_DATA === 'true')) await seedDevData(ds);
            return ds;
          },
        },
        { provide: OTP_MODE, useValue: otpMode },
        { provide: SMS_PROVIDER, useClass: DevMockSmsProvider }, // swap for a real provider when OTP_MODE=sms
        { provide: DISPATCH_RADIUS_KM, useValue: Number(env.DISPATCH_RADIUS_KM ?? 5) },
        { provide: GEOCODING_PROVIDER, useFactory: () => (env.GEO_PROVIDER === 'nominatim' ? new NominatimGeocodingProvider() : new MockGeocodingProvider()) },
        {
          provide: ROUTING_PROVIDER,
          useFactory: () => {
            const key = env.GOOGLE_MAPS_API_KEY || env.GOOGLE_MAP_KEY;
            const osrm = new OsrmRoutingProvider(env.OSRM_URL || 'https://router.project-osrm.org');
            const mock = new MockRoutingProvider();
            if (key && key !== 'YOUR_GOOGLE_MAPS_API_KEY') {
              const google = new GoogleRoutesProvider(key);
              return new FallbackRoutingProvider([google, osrm, mock]);
            }
            return new FallbackRoutingProvider([osrm, mock]);
          },
        },
        {
          provide: BOOKING_CONFIG,
          useValue: {
            batchSize: Number(env.DISPATCH_BATCH_SIZE ?? 3), maxBatches: Number(env.DISPATCH_MAX_BATCHES ?? 3), offerTtlMs: Number(env.OFFER_TTL_MS ?? 20_000),
            arriveMaxMeters: Number(env.ARRIVE_MAX_METERS ?? 500), tickMs: Number(env.DISPATCH_TICK_MS ?? 1000),
            scheduleThresholdMin: Number(env.SCHEDULE_THRESHOLD_MIN ?? 30), dispatchLeadMin: Number(env.DISPATCH_LEAD_MIN ?? 20),
          },
        },
        {
          provide: SIM_CONFIG,
          // Simulated drivers are DEV ONLY and never enabled in production.
          useValue: {
            enabled: !prod && (env.SIM_DRIVERS ?? 'true') === 'true', acceptDelayMs: Number(env.SIM_ACCEPT_DELAY_MS ?? 2000),
            stepMs: Number(env.SIM_STEP_MS ?? 1000), steps: Number(env.SIM_STEPS ?? 30), rejectEvery: Number(env.SIM_REJECT_EVERY ?? 0),
          },
        },
        AuthService,
        FaresService,
        BookingsService,
        DriverSimulator,
        { provide: APP_GUARD, useClass: ThrottlerGuard },
        { provide: APP_GUARD, useClass: AuthGuard },
      ],
    };
  }
}
