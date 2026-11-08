import { DataSource } from 'typeorm';
import {
  AccountStatus, CustomerProfile, DriverApproval, DriverLocation, DriverProfile, PricingRule, PricingVersion,
  Role, ServiceCity, User, Vehicle, VehicleCategory,
} from './entities';
import type { PricingConfig } from '../fares/fare-engine';

/**
 * DEVELOPMENT SEED. All tariffs, drivers, vehicles and phone numbers here are FICTIONAL.
 * Pricing is editable via the admin API/dashboard (creates a new pricing version).
 */
export const SEED_PHONES = {
  admin: '+919000000001',
  ops: '+919000000002',
  support: '+919000000003',
  customer: '+919000000010',
  customer2: '+919000000011',
  driver: '+919000000020', // real (non-simulated) approved driver for the driver app
  driver2: '+919000000021',
};

const baseConfig: PricingConfig = {
  baseFare: '40', includedKm: '2', perKm: '11', perMinute: '1', includedMinutes: '0', minimumFare: '70',
  bookingFee: '10', freeWaitingMinutes: '3', waitingPerMinute: '1.5', extraStopFee: '20',
  nightSurchargePct: '20', nightStartHour: 22, nightEndHour: 5,
  peakWindows: [
    { days: [1, 2, 3, 4, 5], startHour: 8, endHour: 10, multiplier: '1.25' },
    { days: [1, 2, 3, 4, 5], startHour: 17, endHour: 20, multiplier: '1.25' },
  ],
  maxSurgeMultiplier: '2', taxPct: '5', taxMode: 'fare', cancellationFee: '50', cancellationFreeMinutes: 3,
  outstationPerKm: '12', outstationMinKmPerDay: '250', outstationDriverAllowancePerDay: '300',
  rentalPackages: [{ hours: 4, includedKm: 40, price: '1200' }, { hours: 8, includedKm: 80, price: '2200' }],
  rentalExtraPerKm: '13', rentalExtraPerMinute: '1.5',
};

const scale = (c: PricingConfig, m: number): PricingConfig => {
  const f = (v: string) => (Number(v) * m).toFixed(2).replace(/\.00$/, '');
  return {
    ...c, baseFare: f(c.baseFare), perKm: f(c.perKm), perMinute: f(c.perMinute), minimumFare: f(c.minimumFare),
    outstationPerKm: f(c.outstationPerKm!), rentalExtraPerKm: f(c.rentalExtraPerKm!),
    rentalPackages: c.rentalPackages!.map((p) => ({ ...p, price: f(p.price) })),
  };
};

const CATEGORIES = [
  { code: 'auto', name: 'Auto', capacity: 3, mult: 0.8, order: 1, description: 'Quick and affordable (fictional tariff)' },
  { code: 'mini', name: 'Mini', capacity: 4, mult: 1, order: 2, description: 'Compact hatchbacks' },
  { code: 'sedan', name: 'Sedan', capacity: 4, mult: 1.25, order: 3, description: 'Comfortable sedans' },
  { code: 'suv', name: 'SUV', capacity: 6, mult: 1.6, order: 4, description: 'Spacious for groups' },
  { code: 'premium', name: 'Premium', capacity: 4, mult: 2, order: 5, description: 'Top-rated drivers, premium cars' },
];

// Fictional driver start positions around central Chennai & Coimbatore
const CHENNAI_DRIVER_SPOTS: [number, number][] = [
  [13.0827, 80.2707], [13.0674, 80.2376], [13.0418, 80.2341], [13.0012, 80.2565], [12.9815, 80.2180],
  [13.0850, 80.2101], [13.0732, 80.2609], [13.0067, 80.2206], [13.0500, 80.2824], [12.9941, 80.1709],
  [13.0694, 80.1948], [12.9010, 80.2279],
];

const COIMBATORE_DRIVER_SPOTS: [number, number][] = [
  [11.0168, 76.9558], [11.0285, 77.0267], [11.0016, 76.9629], [11.0300, 77.0434],
  [11.0080, 76.9420], [11.0250, 76.9050], [10.9700, 76.9700], [11.0500, 76.9900],
];

export async function seedDevData(ds: DataSource): Promise<void> {
  if ((await ds.getRepository(ServiceCity).count()) > 0) return; // idempotent

  const chennai = await ds.getRepository(ServiceCity).save({
    name: 'Chennai', timezone: 'Asia/Kolkata', centerLat: 13.0827, centerLng: 80.2707, radiusKm: 45, isActive: true,
  });

  const coimbatore = await ds.getRepository(ServiceCity).save({
    name: 'Coimbatore', timezone: 'Asia/Kolkata', centerLat: 11.0168, centerLng: 76.9558, radiusKm: 35, isActive: true,
  });

  const cats = await ds.getRepository(VehicleCategory).save(
    CATEGORIES.map((c) => ({ code: c.code, name: c.name, capacity: c.capacity, sortOrder: c.order, description: c.description, imageUrl: null, isActive: true })),
  );

  const users = ds.getRepository(User);
  const staff: [string, Role][] = [[SEED_PHONES.admin, Role.Admin], [SEED_PHONES.ops, Role.OpsManager], [SEED_PHONES.support, Role.Support]];
  for (const [phone, role] of staff) await users.save({ phone, role, status: AccountStatus.Active });
  const cust = await users.save({ phone: SEED_PHONES.customer, role: Role.Customer, status: AccountStatus.Active });
  await ds.getRepository(CustomerProfile).save({ userId: cust.id, name: 'Demo Customer', email: null, savedAddresses: [], notificationPrefs: {}, referralCode: null });

  // Pricing versions for both cities
  for (const city of [chennai, coimbatore]) {
    const version = await ds.getRepository(PricingVersion).save({
      cityId: city.id, versionNumber: 1, effectiveFrom: new Date('2026-01-01T00:00:00Z'), effectiveTo: null,
      note: `Tariff for ${city.name}`, createdBy: null,
    });
    await ds.getRepository(PricingRule).save(
      cats.map((cat) => ({
        pricingVersionId: version.id, categoryId: cat.id, tripType: 'city',
        config: scale(baseConfig, CATEGORIES.find((c) => c.code === cat.code)!.mult),
      })),
    );
  }

  // Real (non-simulated) test drivers for Driver Partner App testing
  const real: [string, string, number, number, string][] = [
    [SEED_PHONES.driver, 'LiteSpark Driver 1', 10.9619, 76.9806, coimbatore.id],
    [SEED_PHONES.driver2, 'LiteSpark Driver 2', 11.0168, 76.9558, coimbatore.id],
  ];
  for (let i = 0; i < real.length; i++) {
    const [phone, name, lat, lng, cityId] = real[i];
    const ru = await users.save({ phone, role: Role.Driver, status: AccountStatus.Active });
    const rp = await ds.getRepository(DriverProfile).save({ userId: ru.id, name, approval: DriverApproval.Approved, isOnline: false, onActiveTrip: false, cityId, rating: '4.95', isSimulated: false });
    for (const cat of cats) {
      await ds.getRepository(Vehicle).save({
        driverProfileId: rp.id,
        categoryId: cat.id,
        registrationNumber: `TN38LS${i}${cat.code.slice(0, 2).toUpperCase()}01`,
        model: `LiteSpark ${cat.name}`,
        color: 'Purple',
        isActive: true,
      });
    }
    await ds.getRepository(DriverLocation).save({ driverProfileId: rp.id, lat, lng, heading: 0 });
  }
  await ds.getRepository(CustomerProfile).save({ userId: (await users.save({ phone: SEED_PHONES.customer2, role: Role.Customer, status: AccountStatus.Active })).id, name: 'Demo Customer 2', email: null, savedAddresses: [], notificationPrefs: {}, referralCode: null });

  // Simulated drivers in Chennai
  const catCycle = cats.filter((c) => c.code !== 'premium' || true);
  for (let i = 0; i < CHENNAI_DRIVER_SPOTS.length; i++) {
    const cat = catCycle[i % catCycle.length];
    const du = await users.save({ phone: `+91900001${String(i).padStart(4, '0')}`, role: Role.Driver, status: AccountStatus.Active });
    const dp = await ds.getRepository(DriverProfile).save({
      userId: du.id, name: `Chennai Driver ${i + 1}`, approval: DriverApproval.Approved, isOnline: true, onActiveTrip: false,
      cityId: chennai.id, rating: '4.85', isSimulated: true,
    });
    await ds.getRepository(Vehicle).save({ driverProfileId: dp.id, categoryId: cat.id, registrationNumber: `TN01SIM${String(i).padStart(4, '0')}`, model: `${cat.name} (simulated)`, color: 'White', isActive: true });
    await ds.getRepository(DriverLocation).save({ driverProfileId: dp.id, lat: CHENNAI_DRIVER_SPOTS[i][0], lng: CHENNAI_DRIVER_SPOTS[i][1], heading: 0 });
  }

  // Simulated drivers in Coimbatore
  for (let i = 0; i < COIMBATORE_DRIVER_SPOTS.length; i++) {
    const cat = catCycle[i % catCycle.length];
    const du = await users.save({ phone: `+91900002${String(i).padStart(4, '0')}`, role: Role.Driver, status: AccountStatus.Active });
    const dp = await ds.getRepository(DriverProfile).save({
      userId: du.id, name: `Coimbatore Driver ${i + 1}`, approval: DriverApproval.Approved, isOnline: true, onActiveTrip: false,
      cityId: coimbatore.id, rating: '4.90', isSimulated: true,
    });
    await ds.getRepository(Vehicle).save({ driverProfileId: dp.id, categoryId: cat.id, registrationNumber: `TN38SIM${String(i).padStart(4, '0')}`, model: `${cat.name} (simulated)`, color: 'White', isActive: true });
    await ds.getRepository(DriverLocation).save({ driverProfileId: dp.id, lat: COIMBATORE_DRIVER_SPOTS[i][0], lng: COIMBATORE_DRIVER_SPOTS[i][1], heading: 0 });
  }
}
