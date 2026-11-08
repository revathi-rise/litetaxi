import { BadRequestException, Body, ConflictException, Controller, Get, HttpCode, Inject, NotFoundException, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { DataSource, IsNull, MoreThan } from 'typeorm';
import { AuthService, DATA_SOURCE } from './auth/auth.service';
import { CurrentUser, AuthUser, Public, Roles, STAFF_ROLES } from './auth/auth.guard';
import {
  CreatePricingVersionDto, FareEstimateDto, RefreshDto, RouteEstimateDto, SendOtpDto, UpsertCategoryDto, VerifyOtpDto,
} from './common/dto';
import { AuditLog, PricingRule, PricingVersion, Role, ServiceCity, VehicleCategory } from './database/entities';
import { validatePricingConfig } from './fares/fare-engine';
import { FaresService } from './fares/fares.service';
import {
  GEOCODING_PROVIDER, GeoProviderError, GeocodingProvider, LatLng, PlaceResult,
} from './maps/providers';
import { HttpException, HttpStatus } from '@nestjs/common';

/** Per-route rate limit (per minute). THROTTLE_MULTIPLIER exists only so automated tests can relax limits. */
const M = Number(process.env.THROTTLE_MULTIPLIER ?? 1);
const perMinute = (limit: number) => ({ default: { limit: limit * M, ttl: 60_000 } });

@ApiTags('auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public() @Post('send-otp') @HttpCode(200)
  @Throttle(perMinute(5))
  @ApiOperation({ summary: 'Send login OTP. In DEV mode the OTP is returned and clearly labelled; no SMS is sent.' })
  sendOtp(@Body() dto: SendOtpDto) { return this.auth.sendOtp(dto.phone); }

  @Public() @Post('verify-otp') @HttpCode(200)
  @Throttle(perMinute(10))
  verifyOtp(@Body() dto: VerifyOtpDto) { return this.auth.verifyOtp(dto.phone, dto.otp, (dto.role as any) ?? Role.Customer); }

  @Public() @Post('refresh') @HttpCode(200)
  @Throttle(perMinute(20))
  refresh(@Body() dto: RefreshDto) { return this.auth.refresh(dto.refreshToken); }

  @Public() @Post('logout') @HttpCode(200)
  logout(@Body() dto: RefreshDto) { return this.auth.logout(dto.refreshToken); }

  @ApiBearerAuth() @Get('me')
  me(@CurrentUser() u: AuthUser) { return u; }
}

@ApiTags('locations', 'routes')
@Public()
@Controller('api/v1')
export class LocationsController {
  constructor(@Inject(GEOCODING_PROVIDER) private geo: GeocodingProvider, private fares: FaresService) {}

  @Get('locations/search')
  @ApiOperation({ summary: 'Search addresses, landmarks and POIs' })
  async search(@Query('q') q: string, @Query('lat') lat?: string, @Query('lng') lng?: string): Promise<{ results: PlaceResult[] }> {
    if (!q || q.trim().length < 2) throw new BadRequestException({ code: 'QUERY_TOO_SHORT', message: 'Enter at least 2 characters' });
    const near = lat && lng && Number.isFinite(+lat) && Number.isFinite(+lng) ? { lat: +lat, lng: +lng } : undefined;
    try {
      return { results: await this.geo.search(q.slice(0, 120), near) };
    } catch (e) {
      if (e instanceof GeoProviderError) throw new HttpException({ code: e.code, message: e.message }, HttpStatus.BAD_GATEWAY);
      throw e;
    }
  }

  @Get('locations/reverse')
  async reverse(@Query('lat') lat: string, @Query('lng') lng: string) {
    if (!Number.isFinite(+lat) || !Number.isFinite(+lng)) throw new BadRequestException({ code: 'INVALID_COORDS', message: 'lat/lng required' });
    try {
      return { place: await this.geo.reverse({ lat: +lat, lng: +lng }) };
    } catch (e) {
      if (e instanceof GeoProviderError) throw new HttpException({ code: e.code, message: e.message }, HttpStatus.BAD_GATEWAY);
      throw e;
    }
  }

  @Post('routes/estimate') @HttpCode(200)
  @ApiOperation({ summary: 'Road-route distance and ETA (never straight-line unless explicitly labelled mock)' })
  async routeEstimate(@Body() dto: RouteEstimateDto) {
    const r = await this.fares.route(dto.pickup, dto.dropoff, dto.stops);
    return { distanceKm: r.distanceKm, durationMin: r.durationMin, geometry: r.geometry, source: r.source, isEstimate: r.isEstimate, steps: r.steps };
  }
}

@ApiTags('fares', 'vehicles')
@Controller('api/v1')
export class FaresController {
  constructor(private fares: FaresService, @Inject(DATA_SOURCE) private ds: DataSource) {}

  @Public()
  @Post('fares/estimate') @HttpCode(200)
  @Throttle(perMinute(30))
  @ApiOperation({ summary: 'Itemised fare estimates for every available vehicle category (server-calculated)' })
  estimate(@Body() dto: FareEstimateDto, @CurrentUser() u?: AuthUser) {
    return this.fares.estimate({ pickup: dto.pickup, dropoff: dto.dropoff, stops: dto.stops, pickupAt: dto.pickupAt, customerId: u?.role === Role.Customer ? u.id : undefined });
  }

  @Public()
  @Get('vehicles/available')
  @ApiOperation({ summary: 'Vehicle categories with nearby availability and ETA for a pickup point' })
  async available(@Query('lat') lat: string, @Query('lng') lng: string) {
    const p: LatLng = { lat: +lat, lng: +lng };
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) throw new BadRequestException({ code: 'INVALID_COORDS', message: 'lat/lng required' });
    const [cats, avail] = await Promise.all([
      this.ds.getRepository(VehicleCategory).find({ where: { isActive: true }, order: { sortOrder: 'ASC' } }),
      this.fares.availability(p),
    ]);
    return {
      categories: cats.map((c) => {
        const a = avail.get(c.id);
        return { id: c.id, code: c.code, name: c.name, capacity: c.capacity, imageUrl: c.imageUrl, available: !!a, driversNearby: a?.count ?? 0, etaMinutes: a ? FaresService.etaMinutes(a.nearestKm) : null };
      }),
    };
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@Roles(...STAFF_ROLES)
@Controller('api/v1/admin')
export class AdminController {
  constructor(@Inject(DATA_SOURCE) private ds: DataSource) {}

  private audit(u: AuthUser, action: string, entity: string, entityId: string | null, details?: any) {
    return this.ds.getRepository(AuditLog).save({ actorId: u.id, actorRole: u.role, action, entity, entityId, details });
  }

  @Get('cities') cities() { return this.ds.getRepository(ServiceCity).find(); }

  @Get('vehicle-categories') categories() { return this.ds.getRepository(VehicleCategory).find({ order: { sortOrder: 'ASC' } }); }

  @Roles(Role.Admin, Role.OpsManager) @Post('vehicle-categories')
  async createCategory(@Body() dto: UpsertCategoryDto, @CurrentUser() u: AuthUser) {
    if (await this.ds.getRepository(VehicleCategory).findOne({ where: { code: dto.code } })) throw new ConflictException({ code: 'CATEGORY_EXISTS', message: 'Category code already exists' });
    const c = await this.ds.getRepository(VehicleCategory).save({ imageUrl: null, description: null, sortOrder: 0, isActive: true, ...dto });
    await this.audit(u, 'category.create', 'vehicle_category', c.id, dto);
    return c;
  }

  @Roles(Role.Admin, Role.OpsManager) @Put('vehicle-categories/:id')
  async updateCategory(@Param('id') id: string, @Body() dto: UpsertCategoryDto, @CurrentUser() u: AuthUser) {
    const repo = this.ds.getRepository(VehicleCategory);
    const c = await repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Category not found' });
    await repo.save({ ...c, ...dto });
    await this.audit(u, 'category.update', 'vehicle_category', id, dto);
    return repo.findOne({ where: { id } });
  }

  @Get('pricing-versions')
  async versions(@Query('cityId') cityId?: string) {
    return this.ds.getRepository(PricingVersion).find({ where: cityId ? { cityId } : {}, relations: ['rules'], order: { effectiveFrom: 'DESC' } });
  }

  /**
   * Pricing changes are append-only: a new effective-dated version is created and the previous
   * open version is closed at the new effectiveFrom. Existing bookings keep their version id.
   */
  @Roles(Role.Admin, Role.OpsManager) @Post('pricing-versions')
  async createVersion(@Body() dto: CreatePricingVersionDto, @CurrentUser() u: AuthUser) {
    const errors: string[] = [];
    if (!dto.rules.length) errors.push('at least one rule is required');
    const seen = new Set<string>();
    for (const r of dto.rules) {
      const key = `${r.categoryId}:${r.tripType}`;
      if (seen.has(key)) errors.push(`duplicate rule ${key}`);
      seen.add(key);
      for (const e of validatePricingConfig(r.config as any)) errors.push(`${key}: ${e}`);
    }
    if (errors.length) throw new BadRequestException({ code: 'PRICING_INVALID', message: 'Pricing validation failed', errors });

    const effectiveFrom = new Date(dto.effectiveFrom);
    return this.ds.transaction(async (m) => {
      if (!(await m.getRepository(ServiceCity).findOne({ where: { id: dto.cityId } }))) throw new NotFoundException({ code: 'CITY_NOT_FOUND', message: 'City not found' });
      const catIds = [...new Set(dto.rules.map((r) => r.categoryId))];
      const found = await m.getRepository(VehicleCategory).createQueryBuilder('c').where('c.id IN (:...ids)', { ids: catIds }).getCount();
      if (found !== catIds.length) throw new BadRequestException({ code: 'CATEGORY_NOT_FOUND', message: 'Unknown category in rules' });

      const vRepo = m.getRepository(PricingVersion);
      const latest = await vRepo.findOne({ where: { cityId: dto.cityId }, order: { versionNumber: 'DESC' } });
      if (latest && effectiveFrom <= latest.effectiveFrom) {
        throw new BadRequestException({ code: 'EFFECTIVE_DATE_CONFLICT', message: 'effectiveFrom must be later than the current latest version' });
      }
      if (latest && (latest.effectiveTo === null || latest.effectiveTo > effectiveFrom)) {
        await vRepo.update(latest.id, { effectiveTo: effectiveFrom });
      }
      const version = await vRepo.save({ cityId: dto.cityId, versionNumber: (latest?.versionNumber ?? 0) + 1, effectiveFrom, effectiveTo: null, note: dto.note ?? null, createdBy: u.id });
      await m.getRepository(PricingRule).save(dto.rules.map((r) => ({ pricingVersionId: version.id, categoryId: r.categoryId, tripType: r.tripType, config: r.config as any })));
      await m.getRepository(AuditLog).save({ actorId: u.id, actorRole: u.role, action: 'pricing.version.create', entity: 'pricing_version', entityId: version.id, details: { cityId: dto.cityId, effectiveFrom, rules: dto.rules.length } });
      return vRepo.findOne({ where: { id: version.id }, relations: ['rules'] });
    });
  }

  @Roles(Role.Admin) @Get('audit-logs')
  auditLogs(@Query('limit') limit = '50') {
    return this.ds.getRepository(AuditLog).find({ order: { createdAt: 'DESC' }, take: Math.min(200, Math.max(1, +limit || 50)) });
  }
}
