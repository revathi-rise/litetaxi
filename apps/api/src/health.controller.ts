import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { Public } from './auth/auth.guard';
import { DATA_SOURCE } from './auth/auth.service';

@ApiTags('health')
@Controller('api/v1/health')
export class HealthController {
  constructor(@Inject(DATA_SOURCE) private ds: DataSource) {}

  @Public() @Get()
  async health() {
    let db = 'ok';
    try {
      await this.ds.query('SELECT 1');
    } catch {
      db = 'down';
    }
    return { status: db === 'ok' ? 'ok' : 'degraded', db, time: new Date().toISOString() };
  }
}
