import Decimal from 'decimal.js';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { PricingConfig, FareBreakdown } from '../fares/fare-engine';

/** Role set enforced on the backend (see RolesGuard). */
export enum Role {
  Customer = 'customer',
  Driver = 'driver',
  Admin = 'admin',
  OpsManager = 'ops_manager',
  Support = 'support_agent',
}

export enum AccountStatus {
  Active = 'active',
  Suspended = 'suspended',
  Deleted = 'deleted',
}

/** numeric(12,2) <-> string, so currency never passes through JS floats. */
export const decimalTransformer = {
  to: (v?: string | null) => v,
  from: (v?: string | null) => (v === null || v === undefined ? v : new Decimal(String(v)).toFixed(2)),
};

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index({ unique: true }) @Column({ type: 'varchar', length: 20 }) phone: string; // E.164
  @Column({ type: 'varchar', length: 20, default: Role.Customer }) role: Role;
  @Column({ type: 'varchar', length: 20, default: AccountStatus.Active }) status: AccountStatus;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}

@Entity('customer_profiles')
export class CustomerProfile {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index({ unique: true }) @Column({ type: 'uuid' }) userId: string;
  @Column({ type: 'varchar', length: 120, nullable: true }) name: string | null;
  @Column({ type: 'varchar', length: 160, nullable: true }) email: string | null;
  @Column({ type: 'jsonb', default: () => "'[]'" }) savedAddresses: any[];
  @Column({ type: 'jsonb', default: () => "'{}'" }) notificationPrefs: Record<string, boolean>;
  @Column({ type: 'varchar', length: 12, nullable: true }) referralCode: string | null;
}

@Entity('service_cities')
export class ServiceCity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 80 }) name: string;
  @Column({ type: 'varchar', length: 60 }) timezone: string; // IANA tz; pricing & scheduling use local time
  @Column({ type: 'double precision' }) centerLat: number;
  @Column({ type: 'double precision' }) centerLng: number;
  @Column({ type: 'double precision' }) radiusKm: number;
  @Column({ default: true }) isActive: boolean;
}

@Entity('service_zones')
export class ServiceZone {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ type: 'uuid' }) cityId: string;
  @Column({ type: 'varchar', length: 80 }) name: string;
  @Column({ type: 'double precision' }) centerLat: number;
  @Column({ type: 'double precision' }) centerLng: number;
  @Column({ type: 'double precision' }) radiusKm: number;
  @Column({ default: true }) isActive: boolean;
}

@Entity('vehicle_categories')
export class VehicleCategory {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index({ unique: true }) @Column({ type: 'varchar', length: 40 }) code: string;
  @Column({ type: 'varchar', length: 80 }) name: string;
  @Column({ type: 'varchar', length: 240, nullable: true }) description: string | null;
  @Column({ type: 'int' }) capacity: number;
  @Column({ type: 'varchar', length: 300, nullable: true }) imageUrl: string | null;
  @Column({ type: 'int', default: 0 }) sortOrder: number;
  @Column({ default: true }) isActive: boolean;
}

/**
 * A pricing version is an immutable, effective-dated tariff for one city.
 * Bookings/estimates reference the version id, never a copy per booking.
 */
@Entity('pricing_versions')
@Index(['cityId', 'effectiveFrom'])
export class PricingVersion {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) cityId: string;
  @Column({ type: 'int' }) versionNumber: number;
  @Column({ type: 'timestamptz' }) effectiveFrom: Date;
  @Column({ type: 'timestamptz', nullable: true }) effectiveTo: Date | null;
  @Column({ type: 'varchar', length: 240, nullable: true }) note: string | null;
  @Column({ type: 'uuid', nullable: true }) createdBy: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @OneToMany(() => PricingRule, (r) => r.version, { cascade: true }) rules: PricingRule[];
}

@Entity('pricing_rules')
@Index(['pricingVersionId', 'categoryId', 'tripType'], { unique: true })
export class PricingRule {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) pricingVersionId: string;
  @ManyToOne(() => PricingVersion, (v) => v.rules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pricingVersionId' })
  version: PricingVersion;
  @Column({ type: 'uuid' }) categoryId: string;
  @Column({ type: 'varchar', length: 20, default: 'city' }) tripType: string;
  @Column({ type: 'jsonb' }) config: PricingConfig;
}

@Entity('fare_estimates')
export class FareEstimate {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ type: 'uuid', nullable: true }) customerId: string | null;
  @Column({ type: 'uuid' }) categoryId: string;
  @Column({ type: 'uuid' }) pricingVersionId: string;
  @Column({ type: 'uuid' }) pricingRuleId: string;
  @Column({ type: 'jsonb' }) pickup: { lat: number; lng: number; address?: string };
  @Column({ type: 'jsonb' }) dropoff: { lat: number; lng: number; address?: string };
  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: decimalTransformer }) distanceKm: string;
  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: decimalTransformer }) durationMin: string;
  @Column({ type: 'varchar', length: 30 }) routeSource: string;
  @Column({ type: 'timestamptz' }) pickupAt: Date;
  @Column({ type: 'jsonb' }) breakdown: FareBreakdown;
  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: decimalTransformer }) estimatedTotal: string;
  @Column({ type: 'timestamptz' }) expiresAt: Date;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}

export enum DriverApproval {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Suspended = 'suspended',
}

export enum DriverPlan {
  Commission15 = 'commission_15', // 15% commission per ride
  FlatFee15 = 'flat_fee_15',       // Flat ₹15 platform fee per ride
  DailySub29 = 'daily_sub_29',     // ₹29/day unlimited 0% commission pass
}

@Entity('driver_profiles')
export class DriverProfile {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index({ unique: true }) @Column({ type: 'uuid' }) userId: string;
  @Column({ type: 'varchar', length: 120 }) name: string;
  @Column({ type: 'varchar', length: 160, nullable: true }) email: string | null;
  @Column({ type: 'varchar', length: 20, nullable: true }) phone: string | null;
  @Column({ type: 'varchar', length: 20, nullable: true }) aadhaarNumber: string | null;
  @Column({ type: 'text', nullable: true }) aadhaarImageUrl: string | null;
  @Column({ type: 'varchar', length: 40, nullable: true }) licenseNumber: string | null;
  @Column({ type: 'text', nullable: true }) licenseImageUrl: string | null;
  @Column({ type: 'varchar', length: 250, nullable: true }) rejectionReason: string | null;
  @Column({ type: 'varchar', length: 20, default: DriverApproval.Pending }) approval: DriverApproval;
  @Column({ type: 'varchar', length: 30, default: DriverPlan.Commission15 }) pricingPlan: string;
  @Column({ type: 'timestamptz', nullable: true }) subscriptionExpiresAt: Date | null;
  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: decimalTransformer }) walletBalance: string;
  @Index() @Column({ default: false }) isOnline: boolean;
  @Column({ default: false }) onActiveTrip: boolean;
  @Column({ type: 'uuid', nullable: true }) cityId: string | null;
  @Column({ type: 'numeric', precision: 3, scale: 2, default: 5, transformer: decimalTransformer }) rating: string;
  @Column({ default: false }) isSimulated: boolean;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ type: 'uuid' }) driverProfileId: string;
  @Column({ type: 'uuid' }) categoryId: string;
  @Index({ unique: true }) @Column({ type: 'varchar', length: 20 }) registrationNumber: string;
  @Column({ type: 'varchar', length: 80 }) model: string;
  @Column({ type: 'varchar', length: 30, nullable: true }) color: string | null;
  @Column({ type: 'text', nullable: true }) vehicleFrontImageUrl: string | null;
  @Column({ type: 'text', nullable: true }) vehicleBackImageUrl: string | null;
  @Column({ type: 'text', nullable: true }) vehicleLeftImageUrl: string | null;
  @Column({ type: 'text', nullable: true }) vehicleRightImageUrl: string | null;
  @Column({ default: true }) isActive: boolean;
}

@Entity('driver_locations')
export class DriverLocation {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index({ unique: true }) @Column({ type: 'uuid' }) driverProfileId: string;
  @Column({ type: 'double precision' }) lat: number;
  @Column({ type: 'double precision' }) lng: number;
  @Column({ type: 'double precision', nullable: true }) heading: number | null;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}

@Entity('otp_codes')
export class OtpCode {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ type: 'varchar', length: 20 }) phone: string;
  @Column({ type: 'varchar', length: 64 }) codeHash: string;
  @Column({ type: 'timestamptz' }) expiresAt: Date;
  @Column({ type: 'int', default: 0 }) attempts: number;
  @Column({ type: 'timestamptz', nullable: true }) consumedAt: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ type: 'uuid' }) userId: string;
  /** All tokens descended from one login share a family; reuse of a rotated token revokes the family. */
  @Index() @Column({ type: 'uuid' }) familyId: string;
  @Index({ unique: true }) @Column({ type: 'varchar', length: 64 }) tokenHash: string;
  @Column({ type: 'timestamptz' }) expiresAt: Date;
  @Column({ type: 'timestamptz', nullable: true }) revokedAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) rotatedAt: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ type: 'uuid', nullable: true }) actorId: string | null;
  @Column({ type: 'varchar', length: 60, nullable: true }) actorRole: string | null;
  @Index() @Column({ type: 'varchar', length: 80 }) action: string;
  @Column({ type: 'varchar', length: 60 }) entity: string;
  @Column({ type: 'varchar', length: 60, nullable: true }) entityId: string | null;
  @Column({ type: 'jsonb', nullable: true }) details: any;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}

export enum BookingStatus {
  Scheduled = 'SCHEDULED',
  Searching = 'SEARCHING_DRIVER',
  Assigned = 'DRIVER_ASSIGNED',
  Arrived = 'DRIVER_ARRIVED',
  InProgress = 'IN_PROGRESS',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED',
  NoDriver = 'NO_DRIVER_AVAILABLE',
}

@Entity('bookings')
@Index(['customerId', 'idempotencyKey'], { unique: true })
@Index(['status', 'createdAt'])
@Index('uq_bookings_one_active_per_customer', ['customerId'], { unique: true, where: '"isActive" = true' })
export class Booking {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index({ unique: true }) @Column({ type: 'varchar', length: 20 }) reference: string;
  @Index() @Column({ type: 'uuid' }) customerId: string;
  @Column({ type: 'varchar', length: 80 }) idempotencyKey: string;
  /** One estimate can back at most one booking. */
  @Index({ unique: true }) @Column({ type: 'uuid' }) estimateId: string;
  @Column({ type: 'uuid' }) categoryId: string;
  @Column({ type: 'uuid' }) cityId: string;
  @Column({ type: 'uuid' }) pricingVersionId: string;
  @Column({ type: 'uuid' }) pricingRuleId: string;
  @Column({ type: 'jsonb' }) pickup: { lat: number; lng: number; address?: string };
  @Column({ type: 'jsonb' }) dropoff: { lat: number; lng: number; address?: string };
  @Column({ type: 'timestamptz' }) pickupAt: Date;
  @Column({ type: 'varchar', length: 30 }) status: BookingStatus;
  /** Partial unique index below enforces one non-terminal booking per customer. */
  @Column({ default: true }) isActive: boolean;
  @Column({ type: 'varchar', length: 20 }) paymentMethod: string;
  @Column({ type: 'varchar', length: 20, default: 'pending' }) paymentStatus: string;
  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: decimalTransformer }) estimatedDistanceKm: string;
  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: decimalTransformer }) estimatedDurationMin: string;
  @Column({ type: 'jsonb' }) routeGeometry: [number, number][];
  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: decimalTransformer }) estimatedTotal: string;
  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true, transformer: decimalTransformer }) finalTotal: string | null;
  @Column({ type: 'jsonb', nullable: true }) finalBreakdown: FareBreakdown | null;
  @Column({ type: 'uuid', nullable: true }) driverProfileId: string | null;
  @Column({ type: 'uuid', nullable: true }) vehicleId: string | null;
  @Column({ type: 'varchar', length: 6, nullable: true }) startOtp: string | null;
  @Column({ type: 'int', default: 0 }) startOtpAttempts: number;
  @Column({ type: 'varchar', length: 20, nullable: true }) cancelledBy: string | null;
  @Column({ type: 'varchar', length: 200, nullable: true }) cancelReason: string | null;
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0, transformer: decimalTransformer }) cancellationFee: string;
  @Column({ type: 'timestamptz', nullable: true }) assignedAt: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}

@Entity('booking_status_history')
export class BookingStatusHistory {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ type: 'uuid' }) bookingId: string;
  @Column({ type: 'varchar', length: 30, nullable: true }) fromStatus: string | null;
  @Column({ type: 'varchar', length: 30 }) toStatus: string;
  @Column({ type: 'uuid', nullable: true }) actorId: string | null;
  @Column({ type: 'varchar', length: 30, nullable: true }) actorRole: string | null;
  @Column({ type: 'varchar', length: 200, nullable: true }) reason: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
}

@Entity('driver_assignment_attempts')
@Index(['bookingId', 'driverProfileId'], { unique: true })
export class DriverAssignmentAttempt {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) bookingId: string;
  @Index() @Column({ type: 'uuid' }) driverProfileId: string;
  @Column({ type: 'int' }) batch: number;
  /** offered | accepted | rejected | timeout | superseded | cancelled */
  @Column({ type: 'varchar', length: 20 }) status: string;
  @Column({ type: 'double precision' }) pickupDistanceKm: number;
  @Column({ type: 'timestamptz' }) expiresAt: Date;
  @Column({ type: 'timestamptz', nullable: true }) respondedAt: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) offeredAt: Date;
}

@Entity('trip_records')
export class TripRecord {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index({ unique: true }) @Column({ type: 'uuid' }) bookingId: string;
  @Column({ type: 'uuid' }) driverProfileId: string;
  @Column({ type: 'timestamptz', nullable: true }) arrivedAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) startedAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) endedAt: Date | null;
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true, transformer: decimalTransformer }) distanceKm: string | null;
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true, transformer: decimalTransformer }) durationMin: string | null;
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true, transformer: decimalTransformer }) waitingMinutes: string | null;
  /** 'gps_samples' when measured from recorded GPS, else 'estimated_route'. */
  @Column({ type: 'varchar', length: 20, nullable: true }) distanceSource: string | null;
}

/** Precise location samples: retain only as long as needed for billing/disputes (see retention policy in docs). */
@Entity('trip_location_samples')
@Index(['bookingId', 'recordedAt'])
export class TripLocationSample {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) bookingId: string;
  @Column({ type: 'double precision' }) lat: number;
  @Column({ type: 'double precision' }) lng: number;
  @Column({ type: 'timestamptz' }) recordedAt: Date;
}

@Entity('payment_transactions')
export class PaymentTransaction {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ type: 'uuid' }) userId: string;
  @Column({ type: 'varchar', length: 30 }) purpose: string; // 'wallet_topup' | 'trip_fare' | 'subscription'
  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: decimalTransformer }) amount: string;
  @Column({ type: 'varchar', length: 10, default: 'INR' }) currency: string;
  @Index({ unique: true }) @Column({ type: 'varchar', length: 80 }) razorpayOrderId: string;
  @Column({ type: 'varchar', length: 80, nullable: true }) razorpayPaymentId: string | null;
  @Column({ type: 'varchar', length: 120, nullable: true }) razorpaySignature: string | null;
  @Column({ type: 'varchar', length: 30, default: 'created' }) status: string; // 'created' | 'paid' | 'failed'
  @Column({ type: 'jsonb', nullable: true }) metadata: any;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
}

export const ALL_ENTITIES = [
  User, CustomerProfile, ServiceCity, ServiceZone, VehicleCategory, PricingVersion, PricingRule,
  FareEstimate, DriverProfile, Vehicle, DriverLocation, OtpCode, RefreshToken, AuditLog,
  Booking, BookingStatusHistory, DriverAssignmentAttempt, TripRecord, TripLocationSample,
  PaymentTransaction,
];
