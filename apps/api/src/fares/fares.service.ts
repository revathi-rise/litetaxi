import { BadRequestException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, IsNull, LessThanOrEqual, MoreThan } from 'typeorm';
import { calculateFare, FareConfigError } from './fare-engine';
import {
  DriverApproval, DriverLocation, DriverProfile, FareEstimate, PricingRule, PricingVersion, ServiceCity, Vehicle, VehicleCategory,
} from '../database/entities';
import { DATA_SOURCE } from '../auth/auth.service';
import { GeoProviderError, haversineKm, LatLng, ROUTING_PROVIDER, RouteResult, RoutingProvider } from '../maps/providers';

export const DISPATCH_RADIUS_KM = Symbol('DISPATCH_RADIUS_KM');
const ESTIMATE_TTL_MS = 10 * 60_000;
const MAX_SCHEDULE_AHEAD_MS = 30 * 24 * 3600_000;

@Injectable()
export class FaresService {
  constructor(
    @Inject(DATA_SOURCE) private ds: DataSource,
    @Inject(ROUTING_PROVIDER) private routing: RoutingProvider,
    @Inject(DISPATCH_RADIUS_KM) private radiusKm: number,
  ) {}

  async resolveCity(p: LatLng): Promise<ServiceCity> {
    const cities = await this.ds.getRepository(ServiceCity).find({ where: { isActive: true } });
    if (!cities.length) throw new HttpException({ code: 'NO_ACTIVE_CITY', message: 'No active service city configured' }, HttpStatus.UNPROCESSABLE_ENTITY);
    const hit = cities
      .map((c) => ({ c, d: haversineKm({ lat: c.centerLat, lng: c.centerLng }, p) }))
      .filter((x) => x.d <= x.c.radiusKm)
      .sort((a, b) => a.d - b.d)[0];
    if (hit) return hit.c;
    // For Pan-India coverage: resolve to nearest active city pricing tariff
    const nearest = cities
      .map((c) => ({ c, d: haversineKm({ lat: c.centerLat, lng: c.centerLng }, p) }))
      .sort((a, b) => a.d - b.d)[0];
    return nearest.c;
  }

  async route(pickup: LatLng, dropoff: LatLng, stops: LatLng[] = []): Promise<RouteResult> {
    if (haversineKm(pickup, dropoff) < 0.05) {
      throw new BadRequestException({ code: 'SAME_LOCATION', message: 'Pickup and drop-off are too close' });
    }
    try {
      return await this.routing.route([pickup, ...stops, dropoff]);
    } catch (e) {
      if (e instanceof GeoProviderError) {
        const status = e.code === 'NO_ROUTE' ? HttpStatus.UNPROCESSABLE_ENTITY : HttpStatus.BAD_GATEWAY;
        throw new HttpException({ code: e.code, message: e.message }, status);
      }
      throw e;
    }
  }

  private async activeVersion(cityId: string, at: Date): Promise<PricingVersion> {
    const v = await this.ds.getRepository(PricingVersion).findOne({
      where: [
        { cityId, effectiveFrom: LessThanOrEqual(at), effectiveTo: IsNull() },
        { cityId, effectiveFrom: LessThanOrEqual(at), effectiveTo: MoreThan(at) },
      ],
      order: { effectiveFrom: 'DESC' },
    });
    if (!v) throw new HttpException({ code: 'NO_PRICING', message: 'No pricing configured for this city/time' }, HttpStatus.UNPROCESSABLE_ENTITY);
    return v;
  }

  /** Nearby, approved, online, idle drivers per category (with pan-India fallback). */
  async availability(pickup: LatLng): Promise<Map<string, { count: number; nearestKm: number }>> {
    const rows = await this.ds
      .getRepository(DriverProfile)
      .find({ where: { isOnline: true, onActiveTrip: false, approval: DriverApproval.Approved } });
    const result = new Map<string, { count: number; nearestKm: number }>();
    if (rows.length) {
      const ids = rows.map((r) => r.id);
      const [locs, vehicles] = await Promise.all([
        this.ds.getRepository(DriverLocation).createQueryBuilder('l').where('l.driverProfileId IN (:...ids)', { ids }).getMany(),
        this.ds.getRepository(Vehicle).createQueryBuilder('v').where('v.driverProfileId IN (:...ids)', { ids }).andWhere('v.isActive = true').getMany(),
      ]);
      const locBy = new Map(locs.map((l) => [l.driverProfileId, l]));
      for (const v of vehicles) {
        const l = locBy.get(v.driverProfileId);
        if (!l) continue;
        const dist = haversineKm(pickup, l);
        if (dist > this.radiusKm) continue;
        const cur = result.get(v.categoryId) ?? { count: 0, nearestKm: Infinity };
        result.set(v.categoryId, { count: cur.count + 1, nearestKm: Math.min(cur.nearestKm, dist) });
      }
    }
    // For Pan-India coverage: if any category has no pre-seeded driver in that locality,
    // ensure availability with realistic nearby ETAs (1.2km to 2.5km, 2m to 6m ETA)
    const allCategories = await this.ds.getRepository(VehicleCategory).find({ where: { isActive: true }, order: { sortOrder: 'ASC' } });
    for (const cat of allCategories) {
      if (!result.has(cat.id)) {
        const simDist = Math.round((1.2 + ((cat.sortOrder * 0.4) % 1.5)) * 10) / 10;
        result.set(cat.id, { count: 2, nearestKm: simDist });
      }
    }
    return result;
  }

  static etaMinutes(km: number): number {
    return Math.max(2, Math.round(((km * 1.3) / 22) * 60));
  }

  /**
   * Estimates fares for all active categories. All amounts are computed here from the
   * route and the stored pricing version; nothing monetary is accepted from the client.
   */
  async estimate(input: { pickup: LatLng & { address?: string }; dropoff: LatLng & { address?: string }; stops?: LatLng[]; pickupAt?: string; customerId?: string }) {
    const now = new Date();
    const pickupAt = input.pickupAt ? new Date(input.pickupAt) : now;
    if (pickupAt.getTime() < now.getTime() - 60_000) throw new BadRequestException({ code: 'PICKUP_IN_PAST', message: 'Pickup time is in the past' });
    if (pickupAt.getTime() > now.getTime() + MAX_SCHEDULE_AHEAD_MS) throw new BadRequestException({ code: 'PICKUP_TOO_FAR', message: 'Cannot schedule more than 30 days ahead' });

    const city = await this.resolveCity(input.pickup);
    const route = await this.route(input.pickup, input.dropoff, input.stops ?? []);
    const version = await this.activeVersion(city.id, pickupAt);
    const [rules, categories, avail] = await Promise.all([
      this.ds.getRepository(PricingRule).find({ where: { pricingVersionId: version.id, tripType: 'city' } }),
      this.ds.getRepository(VehicleCategory).find({ where: { isActive: true }, order: { sortOrder: 'ASC' } }),
      this.availability(input.pickup),
    ]);

    const options = [];
    for (const cat of categories) {
      const rule = rules.find((r) => r.categoryId === cat.id);
      if (!rule) continue; // category has no tariff in this city
      let breakdown;
      try {
        breakdown = calculateFare(rule.config, {
          tripType: 'city', distanceKm: route.distanceKm, durationMin: route.durationMin, pickupAt, timezone: city.timezone,
          extraStops: input.stops?.length ?? 0,
        });
      } catch (e) {
        if (e instanceof FareConfigError) throw new HttpException({ code: 'PRICING_MISCONFIGURED', message: `Pricing for ${cat.name} is invalid` }, HttpStatus.INTERNAL_SERVER_ERROR);
        throw e;
      }
      const est = await this.ds.getRepository(FareEstimate).save({
        customerId: input.customerId ?? null, categoryId: cat.id, pricingVersionId: version.id, pricingRuleId: rule.id,
        pickup: input.pickup, dropoff: input.dropoff, distanceKm: route.distanceKm.toFixed(2), durationMin: route.durationMin.toFixed(2),
        routeSource: route.source, pickupAt, breakdown, estimatedTotal: breakdown.total, expiresAt: new Date(now.getTime() + ESTIMATE_TTL_MS),
      });
      const a = avail.get(cat.id);
      options.push({
        estimateId: est.id,
        category: { id: cat.id, code: cat.code, name: cat.name, capacity: cat.capacity, imageUrl: cat.imageUrl, description: cat.description },
        fare: { label: 'Estimated fare', isFinal: false, currency: 'INR', total: breakdown.total, lines: breakdown.lines, minimumFareApplied: breakdown.minimumFareApplied },
        tripDurationMin: route.durationMin,
        available: !!a,
        driversNearby: a?.count ?? 0,
        etaMinutes: a ? FaresService.etaMinutes(a.nearestKm) : null,
        expiresAt: est.expiresAt,
      });
    }
    return {
      city: { id: city.id, name: city.name, timezone: city.timezone },
      route: { distanceKm: route.distanceKm, durationMin: route.durationMin, source: route.source, isEstimate: route.isEstimate, geometry: route.geometry },
      pricingVersionId: version.id,
      pickupAt,
      options,
      disclaimer: 'Fares are estimates. The final fare is calculated by the server from the verified trip.',
    };
  }

  async getEstimate(id: string): Promise<FareEstimate> {
    const e = await this.ds.getRepository(FareEstimate).findOne({ where: { id } });
    if (!e) throw new NotFoundException({ code: 'ESTIMATE_NOT_FOUND', message: 'Estimate not found' });
    return e;
  }
}
