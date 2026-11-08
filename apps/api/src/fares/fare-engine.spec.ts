import {
  calculateCancellationFee,
  calculateFare,
  FareConfigError,
  localParts,
  PricingConfig,
} from './fare-engine';

// FICTIONAL test tariff. Hand-computed expectations below.
const cfg: PricingConfig = {
  baseFare: '50',
  includedKm: '2',
  perKm: '12',
  perMinute: '1.5',
  includedMinutes: '0',
  minimumFare: '80',
  bookingFee: '10',
  freeWaitingMinutes: '3',
  waitingPerMinute: '2',
  extraStopFee: '15',
  nightSurchargePct: '25',
  nightStartHour: 22,
  nightEndHour: 6,
  peakWindows: [{ days: [1, 2, 3, 4, 5], startHour: 8, endHour: 10, multiplier: '1.5' }],
  maxSurgeMultiplier: '2',
  taxPct: '5',
  taxMode: 'fare',
  cancellationFee: '50',
  cancellationFreeMinutes: 3,
  outstationPerKm: '11',
  outstationMinKmPerDay: '250',
  outstationDriverAllowancePerDay: '300',
  rentalPackages: [{ hours: 4, includedKm: 40, price: '1400' }],
  rentalExtraPerKm: '14',
  rentalExtraPerMinute: '1',
};

const TZ = 'Asia/Kolkata';
// Tuesday 2026-10-20. IST = UTC+5:30.
const noonTue = new Date('2026-10-20T06:30:00Z'); // 12:00 IST
const nightTue = new Date('2026-10-20T17:30:00Z'); // 23:00 IST
const peakTue = new Date('2026-10-20T03:30:00Z'); // 09:00 IST
const base = { distanceKm: 10, durationMin: 25, pickupAt: noonTue, timezone: TZ };

describe('fare engine', () => {
  it('resolves local hour/day in the city timezone', () => {
    expect(localParts(noonTue, TZ)).toEqual({ hour: 12, day: 2 });
    expect(localParts(nightTue, TZ).hour).toBe(23);
  });

  it('standard city fare: base + distance beyond included km + time + booking fee + tax', () => {
    // core 50 + 8*12 + 25*1.5 = 183.50; +10 = 193.50; tax 9.675 -> 9.68
    const f = calculateFare(cfg, base);
    expect(f.billableKm).toBe('8.00');
    expect(f.subtotal).toBe('193.50');
    expect(f.fare).toBe('193.50');
    expect(f.tax).toBe('9.68');
    expect(f.total).toBe('203.18');
    expect(f.minimumFareApplied).toBe(false);
  });

  it('applies minimum fare as a floor (not additive)', () => {
    // 50 + 0 + 4.5 + 10 = 64.50 -> floor 80; tax 4.00
    const f = calculateFare(cfg, { ...base, distanceKm: 1, durationMin: 3 });
    expect(f.minimumFareApplied).toBe(true);
    expect(f.fare).toBe('80.00');
    expect(f.total).toBe('84.00');
  });

  it('distance within included km is not charged', () => {
    const f = calculateFare(cfg, { ...base, distanceKm: 2, durationMin: 0 });
    expect(f.billableKm).toBe('0.00');
  });

  it('night charge applies on core fare only', () => {
    // night 25% of 183.50 = 45.875 -> 45.88; subtotal 239.38; tax 11.969 -> 11.97
    const f = calculateFare(cfg, { ...base, pickupAt: nightTue });
    expect(f.nightApplied).toBe(true);
    expect(f.subtotal).toBe('239.38');
    expect(f.total).toBe('251.35');
  });

  it('peak window multiplier on weekday morning', () => {
    // surge 183.50*0.5 = 91.75; subtotal 285.25; tax 14.2625 -> 14.26
    const f = calculateFare(cfg, { ...base, pickupAt: peakTue });
    expect(f.appliedMultiplier).toBe('1.5');
    expect(f.subtotal).toBe('285.25');
    expect(f.total).toBe('299.51');
  });

  it('peak window does not apply on Sunday', () => {
    const sunPeak = new Date('2026-10-18T03:30:00Z'); // Sunday 09:00 IST
    expect(calculateFare(cfg, { ...base, pickupAt: sunPeak }).appliedMultiplier).toBe('1');
  });

  it('demand multiplier is capped by maxSurgeMultiplier', () => {
    // surge = 183.50 * (2-1); subtotal 377.00; tax 18.85
    const f = calculateFare(cfg, { ...base, demandMultiplier: 3 });
    expect(f.appliedMultiplier).toBe('2');
    expect(f.total).toBe('395.85');
  });

  it('coupon discount reduces fare before tax', () => {
    // 193.50 - 50 = 143.50; tax 7.175 -> 7.18
    const f = calculateFare(cfg, { ...base, couponDiscount: 50 });
    expect(f.discount).toBe('50.00');
    expect(f.fare).toBe('143.50');
    expect(f.total).toBe('150.68');
  });

  it('discount cannot exceed subtotal; minimum fare still holds', () => {
    const f = calculateFare(cfg, { ...base, distanceKm: 1, durationMin: 3, couponDiscount: 500 });
    expect(f.discount).toBe('64.50');
    expect(f.fare).toBe('80.00');
    expect(f.total).toBe('84.00');
  });

  it('tolls and parking are untaxed pass-through', () => {
    const f = calculateFare(cfg, { ...base, tolls: 40, parking: 20 });
    expect(f.tax).toBe('9.68');
    expect(f.total).toBe('263.18');
  });

  it('waiting charges after free minutes, and extra stops', () => {
    // waiting (8-3)*2 = 10; stop 15; subtotal 218.50 + 10 = 228.50?? recompute below
    // core 183.50 + fee 10 + waiting 10 + stop 15 = 218.50; tax 10.925 -> 10.93
    const f = calculateFare(cfg, { ...base, waitingMinutes: 8, extraStops: 1 });
    expect(f.subtotal).toBe('218.50');
    expect(f.total).toBe('229.43');
  });

  it('waiting within free minutes is free', () => {
    const f = calculateFare(cfg, { ...base, waitingMinutes: 3 });
    expect(f.lines.find((l) => l.code === 'waiting')).toBeUndefined();
  });

  it('taxMode fare_excluding_fees excludes booking fee/waiting/stops from tax base', () => {
    // base 193.50 - 10 = 183.50 * 5% = 9.175 -> 9.18
    const f = calculateFare({ ...cfg, taxMode: 'fare_excluding_fees' }, base);
    expect(f.tax).toBe('9.18');
    expect(f.total).toBe('202.68');
  });

  it('rental package with extra km and time', () => {
    // 1400 + 10*14 + 30*1 = 1570; +10 = 1580; tax 79
    const f = calculateFare(cfg, { tripType: 'rental', rentalHours: 4, distanceKm: 50, durationMin: 270, pickupAt: noonTue, timezone: TZ });
    expect(f.subtotal).toBe('1580.00');
    expect(f.total).toBe('1659.00');
  });

  it('rejects unknown rental package', () => {
    expect(() => calculateFare(cfg, { tripType: 'rental', rentalHours: 9, distanceKm: 1, durationMin: 1, pickupAt: noonTue, timezone: TZ })).toThrow(FareConfigError);
  });

  it('outstation uses per-day minimum km and driver allowance', () => {
    // 50 + 250*11 + 300 = 3100; +10 = 3110; tax 155.50
    const f = calculateFare(cfg, { tripType: 'outstation', days: 1, distanceKm: 100, durationMin: 120, pickupAt: noonTue, timezone: TZ });
    expect(f.subtotal).toBe('3110.00');
    expect(f.total).toBe('3265.50');
  });

  it('avoids floating-point drift (0.1 + 0.2 style)', () => {
    const f = calculateFare({ ...cfg, baseFare: '0.1', perKm: '0.2', perMinute: '0', bookingFee: '0', minimumFare: '0', taxPct: '0', includedKm: '0' }, { ...base, distanceKm: 1, durationMin: 0 });
    expect(f.total).toBe('0.30');
  });

  it('rejects invalid configuration and inputs', () => {
    expect(() => calculateFare({ ...cfg, perKm: '-1' }, base)).toThrow(FareConfigError);
    expect(() => calculateFare({ ...cfg, taxPct: '150' }, base)).toThrow(FareConfigError);
    expect(() => calculateFare(cfg, { ...base, distanceKm: -5 })).toThrow(FareConfigError);
  });

  it('is deterministic and ignores any client-provided amounts', () => {
    const a = calculateFare(cfg, { ...base, total: '1' } as any);
    const b = calculateFare(cfg, base);
    expect(a).toEqual(b);
  });
});

describe('cancellation fee', () => {
  const booked = new Date('2026-10-20T06:30:00Z');
  const at = (m: number) => new Date(booked.getTime() + m * 60000);
  const ctx = { driverAssigned: true, bookedAt: booked, estimatedTotal: '200.00', cancelledBy: 'customer' as const };

  it('is free before a driver is assigned', () => {
    expect(calculateCancellationFee(cfg, { ...ctx, driverAssigned: false, cancelledAt: at(30) })).toBe('0.00');
  });
  it('is free within the grace window', () => {
    expect(calculateCancellationFee(cfg, { ...ctx, cancelledAt: at(2) })).toBe('0.00');
  });
  it('charges the configured fee after the grace window', () => {
    expect(calculateCancellationFee(cfg, { ...ctx, cancelledAt: at(10) })).toBe('50.00');
  });
  it('is capped at the estimated fare', () => {
    expect(calculateCancellationFee(cfg, { ...ctx, estimatedTotal: '30.00', cancelledAt: at(10) })).toBe('30.00');
  });
  it('never charges the customer for driver cancellations', () => {
    expect(calculateCancellationFee(cfg, { ...ctx, cancelledBy: 'driver', cancelledAt: at(10) })).toBe('0.00');
  });
});
