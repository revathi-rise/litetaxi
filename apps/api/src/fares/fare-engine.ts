import Decimal from 'decimal.js';

/**
 * Fare engine: pure, deterministic, decimal-safe. No I/O, no framework deps.
 * Used for both estimates and final billing (same code path, different inputs).
 *
 * Formula (all components configurable):
 *   billableKm      = max(0, distanceKm - includedKm)
 *   billableMinutes = max(0, durationMin - includedMinutes)
 *   core            = baseFare + billableKm*perKm + billableMinutes*perMinute
 *   surge           = core * (peakMultiplier - 1)            (if peak window matches)
 *   night           = core * nightSurchargePct/100           (if night window matches)
 *   extras          = bookingFee + waiting + extraStops
 *   subtotal        = core + surge + night + extras
 *   discount        = min(couponDiscount, subtotal)           (never negative fare)
 *   fare            = max(minimumFare, subtotal - discount)
 *   tax             = taxPct% of the taxable base (see taxMode), excl. pass-through
 *   total           = fare + tax + tolls + parking            (tolls/parking: pass-through, untaxed)
 *
 * Each charge is counted exactly once; the minimum fare is a floor on the
 * pre-tax fare (it is NOT added on top of anything).
 */

export type TaxMode = 'fare' | 'fare_excluding_fees';

export interface PricingConfig {
  baseFare: string;
  includedKm: string;
  perKm: string;
  perMinute: string;
  includedMinutes: string;
  minimumFare: string;
  bookingFee: string;
  /** Free waiting minutes before waiting charges start. */
  freeWaitingMinutes: string;
  waitingPerMinute: string;
  extraStopFee: string;
  nightSurchargePct: string;
  /** Local-hour window [start, end); may wrap midnight, e.g. 22 -> 6. */
  nightStartHour: number;
  nightEndHour: number;
  /** Peak windows evaluated in the city's local timezone. */
  peakWindows: PeakWindow[];
  /** Demand multiplier supplied by dispatch (>= 1). Capped by maxSurgeMultiplier. */
  maxSurgeMultiplier: string;
  taxPct: string;
  taxMode: TaxMode;
  cancellationFee: string;
  /** Cancellation is free within this many minutes of booking, or before driver assignment. */
  cancellationFreeMinutes: number;
  /** Outstation: per-km rate applied when tripType === 'outstation' and daily minimum km. */
  outstationPerKm?: string;
  outstationMinKmPerDay?: string;
  outstationDriverAllowancePerDay?: string;
  /** Hourly rental packages: package price + extra rates. */
  rentalPackages?: RentalPackage[];
  rentalExtraPerKm?: string;
  rentalExtraPerMinute?: string;
}

export interface PeakWindow {
  /** 0 = Sunday ... 6 = Saturday; omitted => every day. */
  days?: number[];
  startHour: number;
  endHour: number;
  multiplier: string;
}

export interface RentalPackage {
  hours: number;
  includedKm: number;
  price: string;
}

export type TripType = 'city' | 'outstation' | 'rental';

export interface FareInput {
  tripType?: TripType;
  distanceKm: number | string;
  durationMin: number | string;
  /** UTC instant of pickup (or scheduled pickup). */
  pickupAt: Date;
  /** IANA timezone of the service city, e.g. Asia/Kolkata. */
  timezone: string;
  waitingMinutes?: number | string;
  extraStops?: number;
  tolls?: number | string;
  parking?: number | string;
  /** Surge multiplier from demand (1 = none). */
  demandMultiplier?: number | string;
  /** Resolved coupon discount in currency units (validation done by coupon service). */
  couponDiscount?: number | string;
  /** outstation: trip days; rental: package hours. */
  days?: number;
  rentalHours?: number;
}

export interface FareLine {
  code: string;
  label: string;
  amount: string;
}

export interface FareBreakdown {
  currency: 'INR';
  lines: FareLine[];
  subtotal: string;
  discount: string;
  /** Pre-tax fare after discount and minimum-fare floor. */
  fare: string;
  tax: string;
  total: string;
  minimumFareApplied: boolean;
  billableKm: string;
  billableMinutes: string;
  appliedMultiplier: string;
  nightApplied: boolean;
}

const ZERO = new Decimal(0);

export class FareConfigError extends Error {}

const d = (v: number | string | undefined | null, fallback = 0): Decimal => {
  if (v === undefined || v === null || v === '') return new Decimal(fallback);
  const x = new Decimal(v);
  if (!x.isFinite()) throw new FareConfigError(`Invalid number: ${v}`);
  return x;
};

const money = (x: Decimal): Decimal => x.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

/** Local hour (0-23) and weekday (0=Sun) of an instant in a timezone. */
export function localParts(at: Date, timezone: string): { hour: number; day: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hourCycle: 'h23',
    weekday: 'short',
  });
  const parts = fmt.formatToParts(at);
  const hour = Number(parts.find((p) => p.type === 'hour')!.value);
  const wk = parts.find((p) => p.type === 'weekday')!.value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wk);
  return { hour, day };
}

const inHourWindow = (hour: number, start: number, end: number): boolean =>
  start === end ? false : start < end ? hour >= start && hour < end : hour >= start || hour < end;

export function validatePricingConfig(c: PricingConfig): string[] {
  const errors: string[] = [];
  const nonNeg: (keyof PricingConfig)[] = [
    'baseFare', 'includedKm', 'perKm', 'perMinute', 'includedMinutes', 'minimumFare',
    'bookingFee', 'freeWaitingMinutes', 'waitingPerMinute', 'extraStopFee',
    'nightSurchargePct', 'taxPct', 'cancellationFee',
  ];
  for (const k of nonNeg) {
    try {
      if (d(c[k] as string).isNegative()) errors.push(`${k} must be >= 0`);
    } catch {
      errors.push(`${k} is not a valid number`);
    }
  }
  if (d(c.maxSurgeMultiplier, 1).lt(1)) errors.push('maxSurgeMultiplier must be >= 1');
  if (d(c.taxPct).gt(100)) errors.push('taxPct must be <= 100');
  for (const h of [c.nightStartHour, c.nightEndHour]) {
    if (!Number.isInteger(h) || h < 0 || h > 23) errors.push('night hours must be integers 0-23');
  }
  for (const w of c.peakWindows ?? []) {
    if (d(w.multiplier).lt(1)) errors.push('peak multiplier must be >= 1');
    if (w.startHour < 0 || w.startHour > 23 || w.endHour < 0 || w.endHour > 24) errors.push('peak hours out of range');
  }
  return errors;
}

export function calculateFare(config: PricingConfig, input: FareInput): FareBreakdown {
  const cfgErrors = validatePricingConfig(config);
  if (cfgErrors.length) throw new FareConfigError(cfgErrors.join('; '));

  const tripType = input.tripType ?? 'city';
  const distanceKm = d(input.distanceKm);
  const durationMin = d(input.durationMin);
  if (distanceKm.isNegative() || durationMin.isNegative()) {
    throw new FareConfigError('distance and duration must be >= 0');
  }

  const lines: FareLine[] = [];
  const push = (code: string, label: string, amount: Decimal) => {
    const a = money(amount);
    if (!a.isZero()) lines.push({ code, label, amount: a.toFixed(2) });
    return a;
  };

  let core = ZERO;
  let billableKm = ZERO;
  let billableMinutes = ZERO;
  let rentalPackage: RentalPackage | undefined;

  if (tripType === 'rental') {
    rentalPackage = config.rentalPackages?.find((p) => p.hours === input.rentalHours);
    if (!rentalPackage) throw new FareConfigError('Unknown rental package');
    core = core.plus(push('rental_package', `${rentalPackage.hours}h rental package`, d(rentalPackage.price)));
    const extraKm = Decimal.max(0, distanceKm.minus(rentalPackage.includedKm));
    const extraMin = Decimal.max(0, durationMin.minus(rentalPackage.hours * 60));
    billableKm = extraKm;
    billableMinutes = extraMin;
    core = core
      .plus(push('rental_extra_km', 'Extra distance', extraKm.times(d(config.rentalExtraPerKm))))
      .plus(push('rental_extra_time', 'Extra time', extraMin.times(d(config.rentalExtraPerMinute))));
  } else if (tripType === 'outstation') {
    const days = Math.max(1, input.days ?? 1);
    const minKm = d(config.outstationMinKmPerDay).times(days);
    billableKm = Decimal.max(distanceKm, minKm);
    const perKm = d(config.outstationPerKm ?? config.perKm);
    core = core
      .plus(push('base', 'Base fare', d(config.baseFare)))
      .plus(push('outstation_distance', `Outstation distance (${billableKm.toFixed(1)} km billed)`, billableKm.times(perKm)))
      .plus(push('driver_allowance', 'Driver allowance', d(config.outstationDriverAllowancePerDay).times(days)));
  } else {
    billableKm = Decimal.max(0, distanceKm.minus(d(config.includedKm)));
    billableMinutes = Decimal.max(0, durationMin.minus(d(config.includedMinutes)));
    core = core
      .plus(push('base', 'Base fare', d(config.baseFare)))
      .plus(push('distance', `Distance (${billableKm.toFixed(1)} km beyond ${d(config.includedKm).toString()} km)`, billableKm.times(d(config.perKm))))
      .plus(push('time', `Time (${billableMinutes.toFixed(0)} min)`, billableMinutes.times(d(config.perMinute))));
  }

  // Demand/peak multiplier: highest of dispatch demand and matching peak window; capped.
  const { hour, day } = localParts(input.pickupAt, input.timezone);
  let multiplier = d(input.demandMultiplier, 1);
  for (const w of config.peakWindows ?? []) {
    const dayOk = !w.days || w.days.includes(day);
    if (dayOk && inHourWindow(hour, w.startHour, w.endHour)) {
      multiplier = Decimal.max(multiplier, d(w.multiplier));
    }
  }
  multiplier = Decimal.min(Decimal.max(multiplier, 1), d(config.maxSurgeMultiplier, 1));
  const surge = push('surge', `Peak/demand pricing (x${multiplier.toString()})`, core.times(multiplier.minus(1)));

  const nightApplied = inHourWindow(hour, config.nightStartHour, config.nightEndHour) && !d(config.nightSurchargePct).isZero();
  const night = nightApplied
    ? push('night', `Night charge (${d(config.nightSurchargePct).toString()}%)`, core.times(d(config.nightSurchargePct)).div(100))
    : ZERO;

  const bookingFee = push('booking_fee', 'Booking fee', d(config.bookingFee));
  const waitMin = Decimal.max(0, d(input.waitingMinutes).minus(d(config.freeWaitingMinutes)));
  const waiting = push('waiting', `Waiting (${waitMin.toFixed(0)} min)`, waitMin.times(d(config.waitingPerMinute)));
  const stops = push('extra_stops', `Additional stops (${input.extraStops ?? 0})`, d(config.extraStopFee).times(input.extraStops ?? 0));

  const feesAndExtras = bookingFee.plus(waiting).plus(stops);
  const subtotal = money(core.plus(surge).plus(night).plus(feesAndExtras));

  const discount = Decimal.min(money(d(input.couponDiscount)), subtotal);
  if (!discount.isZero()) lines.push({ code: 'discount', label: 'Coupon discount', amount: discount.negated().toFixed(2) });

  const afterDiscount = subtotal.minus(discount);
  const minimumFare = d(config.minimumFare);
  const minimumFareApplied = afterDiscount.lt(minimumFare);
  const fare = Decimal.max(afterDiscount, minimumFare);
  if (minimumFareApplied) {
    lines.push({ code: 'minimum_fare_adjustment', label: 'Minimum fare adjustment', amount: money(minimumFare.minus(afterDiscount)).toFixed(2) });
  }

  const taxableBase = config.taxMode === 'fare_excluding_fees' ? Decimal.max(0, fare.minus(feesAndExtras)) : fare;
  const tax = money(taxableBase.times(d(config.taxPct)).div(100));
  if (!tax.isZero()) lines.push({ code: 'tax', label: `Taxes (${d(config.taxPct).toString()}%)`, amount: tax.toFixed(2) });

  const tolls = push('tolls', 'Tolls (pass-through)', d(input.tolls));
  const parking = push('parking', 'Parking (pass-through)', d(input.parking));

  const total = money(fare.plus(tax).plus(tolls).plus(parking));

  return {
    currency: 'INR',
    lines,
    subtotal: subtotal.toFixed(2),
    discount: discount.toFixed(2),
    fare: money(fare).toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2),
    minimumFareApplied,
    billableKm: billableKm.toFixed(2),
    billableMinutes: billableMinutes.toFixed(2),
    appliedMultiplier: multiplier.toString(),
    nightApplied,
  };
}

/**
 * Cancellation fee policy. Free if no driver assigned yet, or within the free window
 * after booking; otherwise the configured fee (capped at the estimated fare).
 */
export function calculateCancellationFee(
  config: PricingConfig,
  ctx: { driverAssigned: boolean; bookedAt: Date; cancelledAt: Date; estimatedTotal: string; cancelledBy: 'customer' | 'driver' | 'admin' | 'system' },
): string {
  if (ctx.cancelledBy !== 'customer' || !ctx.driverAssigned) return '0.00';
  const minutes = (ctx.cancelledAt.getTime() - ctx.bookedAt.getTime()) / 60000;
  if (minutes <= config.cancellationFreeMinutes) return '0.00';
  return money(Decimal.min(d(config.cancellationFee), d(ctx.estimatedTotal))).toFixed(2);
}
