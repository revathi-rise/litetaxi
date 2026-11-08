import { Body, Controller, Get, Headers, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, IsUUID, Length, Matches, Max, Min } from 'class-validator';
import { AuthUser, CurrentUser, Roles, STAFF_ROLES } from '../auth/auth.guard';
import { Role } from '../database/entities';
import { BadRequestException } from '@nestjs/common';
import { RegisterDriverDto, RejectDriverDto, UpdateDriverPlanDto } from '../common/dto';
import { BookingsService } from './bookings.service';

class CreateBookingDto {
  @IsUUID() estimateId: string;
  @IsIn(['cash', 'upi', 'card', 'wallet']) paymentMethod: string;
}
class CancelDto {
  @IsOptional() @IsString() @Length(0, 200) reason?: string;
}
class AvailabilityDto {
  @IsBoolean() online: boolean;
}
class LocationDto {
  @IsNumber() @Min(-90) @Max(90) lat: number;
  @IsNumber() @Min(-180) @Max(180) lng: number;
  @IsOptional() @IsNumber() @Min(0) @Max(360) heading?: number;
}
class StartDto {
  @Matches(/^\d{4}$/, { message: 'otp must be 4 digits' }) otp: string;
}

@ApiTags('bookings')
@ApiBearerAuth()
@Roles(Role.Customer)
@Controller('api/v1')
export class CustomerBookingsController {
  constructor(private svc: BookingsService) {}

  @Post('bookings')
  @HttpCode(201)
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Unique per booking attempt; retries with the same key return the same booking' })
  async create(@Body() dto: CreateBookingDto, @Headers('idempotency-key') key: string | undefined, @CurrentUser() u: AuthUser) {
    if (!key || key.length < 8 || key.length > 80) throw new BadRequestException({ code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key header (8-80 chars) is required' });
    const { booking, replayed } = await this.svc.create(u.id, { estimateId: dto.estimateId, paymentMethod: dto.paymentMethod, idempotencyKey: key });
    return { replayed, booking: await this.svc.snapshot(booking, true) };
  }

  @Get('bookings/:id/track')
  track(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthUser) { return this.svc.track(u.id, id); }

  @Get('bookings/:id')
  get(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthUser) { return this.svc.track(u.id, id); }

  @Post('bookings/:id/cancel') @HttpCode(200)
  async cancel(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CancelDto, @CurrentUser() u: AuthUser) {
    return this.svc.snapshot(await this.svc.customerCancel(u.id, id, dto.reason), true);
  }

  @Get('customers/me/bookings')
  list(@Query('page') page: string | undefined, @CurrentUser() u: AuthUser) { return this.svc.listForCustomer(u.id, Number(page) || 1); }

  @Get('customers/me/active-booking')
  async active(@CurrentUser() u: AuthUser) { return { booking: await this.svc.activeFor(u.id) }; }
}

@ApiTags('drivers', 'trips')
@ApiBearerAuth()
@Roles(Role.Driver)
@Controller('api/v1')
export class DriverController {
  constructor(private svc: BookingsService) {}

  @Post('drivers/availability') @HttpCode(200)
  async availability(@Body() dto: AvailabilityDto, @CurrentUser() u: AuthUser) { return this.svc.setAvailability((await this.svc.driverProfileFor(u.id)).id, dto.online); }

  @Post('drivers/location') @HttpCode(200)
  async location(@Body() dto: LocationDto, @CurrentUser() u: AuthUser) { return this.svc.updateLocation((await this.svc.driverProfileFor(u.id)).id, dto); }

  @Get('drivers/ride-requests')
  async requests(@CurrentUser() u: AuthUser) { return { requests: await this.svc.openOffers((await this.svc.driverProfileFor(u.id)).id) }; }

  @Get('drivers/active-trip')
  async activeTrip(@CurrentUser() u: AuthUser) { return { trip: await this.svc.activeForDriver((await this.svc.driverProfileFor(u.id)).id) }; }

  @Post('drivers/ride-requests/:id/accept') @HttpCode(200)
  async accept(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthUser) {
    const b = await this.svc.accept((await this.svc.driverProfileFor(u.id)).id, id);
    return this.svc.snapshot(b, false);
  }

  @Post('drivers/ride-requests/:id/reject') @HttpCode(200)
  async reject(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthUser) { return this.svc.reject((await this.svc.driverProfileFor(u.id)).id, id); }

  @Post('trips/:id/arrive') @HttpCode(200)
  async arrive(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthUser) { return this.svc.snapshot(await this.svc.arrive((await this.svc.driverProfileFor(u.id)).id, id), false); }

  @Post('trips/:id/start') @HttpCode(200)
  async start(@Param('id', ParseUUIDPipe) id: string, @Body() dto: StartDto, @CurrentUser() u: AuthUser) { return this.svc.snapshot(await this.svc.start((await this.svc.driverProfileFor(u.id)).id, id, dto.otp), false); }

  @Post('trips/:id/complete') @HttpCode(200)
  async complete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthUser) { return this.svc.snapshot(await this.svc.complete((await this.svc.driverProfileFor(u.id)).id, id), false); }

  @Post('trips/:id/cash-collected') @HttpCode(200)
  async cash(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() u: AuthUser) { return this.svc.snapshot(await this.svc.confirmCash((await this.svc.driverProfileFor(u.id)).id, id), false); }

  @Get('drivers/profile')
  async profile(@CurrentUser() u: AuthUser) {
    return this.svc.getDriverSelf(u.id);
  }

  @Get('drivers/trips')
  async trips(@CurrentUser() u: AuthUser) {
    return this.svc.getDriverTrips((await this.svc.driverProfileFor(u.id)).id);
  }

  @Get('drivers/wallet')
  async wallet(@CurrentUser() u: AuthUser) {
    return this.svc.getDriverWallet((await this.svc.driverProfileFor(u.id)).id);
  }

  @Post('drivers/plan')
  @HttpCode(200)
  async updatePlan(@Body() dto: UpdateDriverPlanDto, @CurrentUser() u: AuthUser) {
    return this.svc.updateDriverPlan(u.id, dto.plan);
  }

  @Post('drivers/subscription/activate')
  @HttpCode(200)
  async activateSub(@Body() body: { tier?: 'daily_29' | 'monthly_699' }, @CurrentUser() u: AuthUser) {
    return this.svc.activateSubscriptionFromWallet(u.id, body.tier || 'daily_29');
  }

  @Post('drivers/register')
  @HttpCode(200)
  async register(@Body() dto: RegisterDriverDto, @CurrentUser() u: AuthUser) {
    return this.svc.registerDriver(u.id, dto);
  }

  @Post('trips/:id/cancel') @HttpCode(200)
  async cancel(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CancelDto, @CurrentUser() u: AuthUser) {
    return this.svc.snapshot(await this.svc.driverCancel((await this.svc.driverProfileFor(u.id)).id, id, dto.reason ?? 'no reason'), false);
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@Roles(...STAFF_ROLES)
@Controller('api/v1/admin/bookings')
export class AdminBookingsController {
  constructor(private svc: BookingsService) {}

  @Get()
  list(@Query('status') status?: string, @Query('search') search?: string, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.svc.adminList({ status, search, page: Number(page) || 1, pageSize: Number(pageSize) || 20 });
  }

  @Get(':id')
  detail(@Param('id', ParseUUIDPipe) id: string) { return this.svc.adminDetail(id); }

  @Roles(Role.Admin, Role.OpsManager) @Post(':id/cancel') @HttpCode(200)
  async cancel(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CancelDto, @CurrentUser() u: AuthUser) {
    return this.svc.snapshot(await this.svc.adminCancel(id, { id: u.id, role: u.role }, dto.reason ?? 'cancelled by operations'), false);
  }
}

@ApiTags('admin-portal')
@ApiBearerAuth()
@Roles(...STAFF_ROLES)
@Controller('api/v1/admin')
export class AdminPortalController {
  constructor(private svc: BookingsService) {}

  @Get('stats')
  stats() { return this.svc.adminStats(); }

  @Get('drivers')
  drivers(@Query('status') status?: string, @Query('search') search?: string) {
    return this.svc.adminListDrivers(status, search);
  }

  @Post('drivers/:id/approve') @HttpCode(200)
  approveDriver(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.adminApproveDriver(id);
  }

  @Post('drivers/:id/reject') @HttpCode(200)
  rejectDriver(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RejectDriverDto) {
    return this.svc.adminRejectDriver(id, dto.reason);
  }

  @Get('customers')
  customers() { return this.svc.adminListCustomers(); }

  @Get('rides/current')
  currentRides() { return this.svc.adminCurrentRides(); }
}
