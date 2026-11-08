import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule.register());
  const origins = process.env.CORS_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean);
  app.enableCors({ origin: origins?.length ? origins : process.env.NODE_ENV === 'production' ? false : true });
  configureApp(app, { swagger: process.env.NODE_ENV !== 'production' });
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`SwiftCab API on http://localhost:${port}  (docs: /api/docs, db: ${process.env.DB_MODE ?? 'memory'}, otp: ${process.env.OTP_MODE ?? 'dev'})`);
}
bootstrap();
