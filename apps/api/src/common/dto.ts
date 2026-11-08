import { Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsDateString, IsEnum, IsIn, IsNumber, IsObject, IsOptional, IsString, IsUUID, Length, Matches, Max, Min,
  ValidateNested,
} from 'class-validator';
import { Role } from '../database/entities';

export class SendOtpDto {
  /** E.164, e.g. +919876543210 */
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'phone must be E.164, e.g. +919876543210' }) phone: string;
  @IsOptional() @IsString() role?: string;
}

export class VerifyOtpDto {
  @Matches(/^\+[1-9]\d{7,14}$/) phone: string;
  @Matches(/^\d{6}$/, { message: 'otp must be 6 digits' }) otp: string;
  /** Only used when creating a new account. Staff roles can never be self-assigned. */
  @IsOptional() @IsIn([Role.Customer, Role.Driver]) role?: Role.Customer | Role.Driver;
}

export class RefreshDto {
  @IsString() @Length(20, 200) refreshToken: string;
}

export class PointDto {
  @IsNumber() @Min(-90) @Max(90) lat: number;
  @IsNumber() @Min(-180) @Max(180) lng: number;
  @IsOptional() @IsString() @Length(0, 500) address?: string;
  @IsOptional() @IsString() @Length(0, 300) name?: string;
  @IsOptional() @IsString() id?: string;
}

export class RouteEstimateDto {
  @ValidateNested() @Type(() => PointDto) pickup: PointDto;
  @ValidateNested() @Type(() => PointDto) dropoff: PointDto;
  @IsOptional() @IsArray() @ArrayMaxSize(3) @ValidateNested({ each: true }) @Type(() => PointDto) stops?: PointDto[];
}

export class FareEstimateDto extends RouteEstimateDto {
  /** Optional scheduled pickup time (ISO-8601). Defaults to now. */
  @IsOptional() @IsDateString() pickupAt?: string;
  @IsOptional() @IsIn(['city']) tripType?: 'city';
}

export class PricingRuleDto {
  @IsUUID() categoryId: string;
  @IsIn(['city', 'outstation', 'rental']) tripType: 'city' | 'outstation' | 'rental';
  @IsObject() config: Record<string, any>;
}

export class CreatePricingVersionDto {
  @IsUUID() cityId: string;
  @IsDateString() effectiveFrom: string;
  @IsOptional() @IsString() @Length(0, 240) note?: string;
  @IsArray() @ArrayMaxSize(100) @ValidateNested({ each: true }) @Type(() => PricingRuleDto) rules: PricingRuleDto[];
}

export class UpsertCategoryDto {
  @Matches(/^[a-z0-9_]{2,40}$/) code: string;
  @IsString() @Length(2, 80) name: string;
  @IsOptional() @IsString() @Length(0, 240) description?: string;
  @IsNumber() @Min(1) @Max(20) capacity: number;
  @IsOptional() @IsString() @Length(0, 300) imageUrl?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
  @IsOptional() isActive?: boolean;
}

export class RegisterDriverDto {
  @IsString() @Length(2, 100) name: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsString() @Length(4, 25) aadhaarNumber: string;
  @IsOptional() @IsString() aadhaarImageUrl?: string;
  @IsString() @Length(4, 35) licenseNumber: string;
  @IsOptional() @IsString() licenseImageUrl?: string;

  // Vehicle info
  @IsString() categoryId: string;
  @IsString() @Length(4, 20) registrationNumber: string;
  @IsString() @Length(2, 80) model: string;
  @IsOptional() @IsString() @Length(0, 30) color?: string;
  @IsOptional() @IsString() vehicleFrontImageUrl?: string;
  @IsOptional() @IsString() vehicleBackImageUrl?: string;
  @IsOptional() @IsString() vehicleLeftImageUrl?: string;
  @IsOptional() @IsString() vehicleRightImageUrl?: string;
  @IsOptional() @IsIn(['commission_15', 'flat_fee_15', 'daily_sub_29']) pricingPlan?: string;
}

export class RejectDriverDto {
  @IsOptional() @IsString() @Length(0, 200) reason?: string;
}

export class UpdateDriverPlanDto {
  @IsIn(['commission_15', 'flat_fee_15', 'daily_sub_29']) plan: 'commission_15' | 'flat_fee_15' | 'daily_sub_29';
}

export class CreateRazorpayOrderDto {
  @IsNumber() @Min(1) amount: number; // in Rupees
  @IsIn(['wallet_topup', 'trip_fare', 'subscription']) purpose: 'wallet_topup' | 'trip_fare' | 'subscription';
  @IsOptional() @IsString() bookingId?: string;
  @IsOptional() @IsIn(['daily_29', 'monthly_699']) subscriptionTier?: 'daily_29' | 'monthly_699';
}

export class VerifyRazorpayPaymentDto {
  @IsString() razorpayOrderId: string;
  @IsString() razorpayPaymentId: string;
  @IsString() razorpaySignature: string;
}

export { IsEnum };
