import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DATA_SOURCE } from '../auth/auth.service';
import { Booking, BookingStatus, DriverLocation, DriverProfile } from '../database/entities';
import { haversineKm, LatLng, ROUTING_PROVIDER, RoutingProvider } from '../maps/providers';
import { BookingsService } from './bookings.service';

export interface SimConfig {
  enabled: boolean;
  acceptDelayMs: number;
  stepMs: number;
  steps: number;
  rejectEvery: number; // 0 = never; N = every Nth simulated offer is rejected (exercises re-dispatch)
}
export const SIM_CONFIG = Symbol('SIM_CONFIG');

/** Evenly spaced points along a [lng,lat] polyline. */
export function pointsAlong(geometry: [number, number][], n: number): LatLng[] {
  const pts = geometry.map(([lng, lat]) => ({ lat, lng }));
  if (pts.length === 1) return Array(n).fill(pts[0]);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + haversineKm(pts[i - 1], pts[i]));
  const total = cum[cum.length - 1] || 1e-9;
  const out: LatLng[] = [];
  for (let k = 1; k <= n; k++) {
    const d = (total * k) / n;
    let i = 1;
    while (i < cum.length - 1 && cum[i] < d) i++;
    const seg = cum[i] - cum[i - 1] || 1e-9;
    const t = Math.min(1, Math.max(0, (d - cum[i - 1]) / seg));
    out.push({ lat: pts[i - 1].lat + (pts[i].lat - pts[i - 1].lat) * t, lng: pts[i - 1].lng + (pts[i].lng - pts[i - 1].lng) * t });
  }
  return out;
}

/**
 * DEV ONLY. Plays the role of a simulated driver (profiles flagged isSimulated): accepts offers, drives to the
 * pickup with mock GPS, verifies the trip code, drives to the destination and completes. All actions go through the
 * same service methods the real driver app uses, so the full lifecycle is exercised.
 */
@Injectable()
export class DriverSimulator {
  private offerCount = 0;
  constructor(
    private bookings: BookingsService,
    @Inject(DATA_SOURCE) private ds: DataSource,
    @Inject(ROUTING_PROVIDER) private routing: RoutingProvider,
    @Inject(SIM_CONFIG) private cfg: SimConfig,
  ) {
    if (cfg.enabled) bookings.onOffer((o) => void this.onOffer(o.bookingId, o.driverProfileId).catch(() => undefined));
  }

  private sleep(ms: number) {
    return new Promise<void>((r) => { const t = setTimeout(r, ms); t.unref?.(); });
  }

  private async onOffer(bookingId: string, driverProfileId: string) {
    const profile = await this.ds.getRepository(DriverProfile).findOne({ where: { id: driverProfileId } });
    if (!profile?.isSimulated) return;
    this.offerCount++;
    await this.sleep(this.cfg.acceptDelayMs);
    if (this.cfg.rejectEvery > 0 && this.offerCount % this.cfg.rejectEvery === 0) {
      await this.bookings.reject(driverProfileId, bookingId).catch(() => undefined);
      return;
    }
    let booking: Booking;
    try {
      booking = await this.bookings.accept(driverProfileId, bookingId);
    } catch {
      return; // someone else got it / offer expired
    }
    await this.drive(booking, driverProfileId);
  }

  private async live(id: string, ...statuses: BookingStatus[]) {
    const b = await this.ds.getRepository(Booking).findOne({ where: { id } });
    return b && statuses.includes(b.status) ? b : null;
  }

  private async path(from: LatLng, to: LatLng): Promise<LatLng[]> {
    try {
      const r = await this.routing.route([from, to]);
      const n = Math.max(this.cfg.steps, Math.min(80, r.geometry.length));
      return pointsAlong(r.geometry, n);
    } catch {
      return pointsAlong([[from.lng, from.lat], [to.lng, to.lat]], this.cfg.steps);
    }
  }

  private async drive(b: Booking, profileId: string) {
    const loc = await this.ds.getRepository(DriverLocation).findOneOrFail({ where: { driverProfileId: profileId } });
    for (const p of await this.path(loc, b.pickup)) {
      await this.sleep(this.cfg.stepMs);
      if (!(await this.live(b.id, BookingStatus.Assigned))) return;
      await this.bookings.updateLocation(profileId, p);
    }
    await this.bookings.updateLocation(profileId, b.pickup);
    if (!(await this.live(b.id, BookingStatus.Assigned))) return;
    await this.bookings.arrive(profileId, b.id);
    await this.sleep(this.cfg.stepMs * 2);
    const arrived = await this.live(b.id, BookingStatus.Arrived);
    if (!arrived) return;
    await this.bookings.start(profileId, b.id, arrived.startOtp!);
    for (const p of await this.path(b.pickup, b.dropoff)) {
      await this.sleep(this.cfg.stepMs);
      if (!(await this.live(b.id, BookingStatus.InProgress))) return;
      await this.bookings.updateLocation(profileId, p);
    }
    if (!(await this.live(b.id, BookingStatus.InProgress))) return;
    await this.bookings.complete(profileId, b.id);
    // simulated driver collects cash immediately
    await this.bookings.confirmCash(profileId, b.id).catch(() => undefined);
  }
}
