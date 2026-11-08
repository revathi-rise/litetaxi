import { BadRequestException, HttpException, HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'crypto';
import { DataSource, IsNull } from 'typeorm';
import { AccountStatus, CustomerProfile, DriverProfile, OtpCode, RefreshToken, Role, User } from '../database/entities';

export const OTP_MODE = Symbol('OTP_MODE');
export const DATA_SOURCE = Symbol('DATA_SOURCE');

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const OTP_TTL_MS = 5 * 60_000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_GAP_MS = 30_000;
const ACCESS_TTL_S = 7 * 24 * 3600; // 7 days in dev for seamless testing
const REFRESH_TTL_MS = 30 * 24 * 3600_000;

/** SMS delivery abstraction. Real providers (MSG91/Twilio/etc.) implement this interface. */
export interface SmsProvider {
  send(phone: string, message: string): Promise<void>;
}
export const SMS_PROVIDER = Symbol('SMS_PROVIDER');
/** DEV ONLY. Does not send any SMS. */
export class DevMockSmsProvider implements SmsProvider {
  async send(): Promise<void> {
    /* intentionally a no-op: the OTP is returned in the API response in dev mode */
  }
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATA_SOURCE) private ds: DataSource,
    private jwt: JwtService,
    @Inject(OTP_MODE) private otpMode: 'dev' | 'sms',
    @Inject(SMS_PROVIDER) private sms: SmsProvider,
  ) {}

  async sendOtp(phone: string) {
    const otps = this.ds.getRepository(OtpCode);
    const last = await otps.findOne({ where: { phone }, order: { createdAt: 'DESC' } });
    if (last && Date.now() - last.createdAt.getTime() < OTP_RESEND_GAP_MS) {
      throw new HttpException({ code: 'OTP_RATE_LIMITED', message: 'Please wait before requesting another OTP' }, HttpStatus.TOO_MANY_REQUESTS);
    }
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await otps.save({ phone, codeHash: sha256(`${phone}:${code}`), expiresAt: new Date(Date.now() + OTP_TTL_MS), attempts: 0, consumedAt: null });
    await this.sms.send(phone, `Your SwiftCab code is ${code}`);
    const res: { sent: true; expiresInSeconds: number; provider: string; devOtp?: string; notice?: string } = {
      sent: true, expiresInSeconds: OTP_TTL_MS / 1000, provider: this.otpMode === 'dev' ? 'DEV_MOCK' : 'SMS',
    };
    if (this.otpMode === 'dev') {
      res.devOtp = code;
      res.notice = 'DEV MODE: no SMS was sent. This OTP is returned for testing only.';
    }
    return res;
  }

  async verifyOtp(phone: string, code: string, role: Role.Customer | Role.Driver = Role.Customer) {
    const otps = this.ds.getRepository(OtpCode);
    const otp = await otps.findOne({ where: { phone, consumedAt: IsNull() }, order: { createdAt: 'DESC' } });
    const invalid = () => new BadRequestException({ code: 'OTP_INVALID', message: 'Invalid or expired OTP' });
    if (!otp || otp.expiresAt.getTime() < Date.now() || otp.attempts >= OTP_MAX_ATTEMPTS) throw invalid();

    const expected = Buffer.from(otp.codeHash, 'hex');
    const given = Buffer.from(sha256(`${phone}:${code}`), 'hex');
    if (!timingSafeEqual(expected, given)) {
      await otps.update(otp.id, { attempts: otp.attempts + 1 });
      throw invalid();
    }
    // Atomic single-use consumption
    const res = await otps.update({ id: otp.id, consumedAt: IsNull() }, { consumedAt: new Date() });
    if (!res.affected) throw invalid();

    let user = await this.ds.getRepository(User).findOne({ where: { phone } });
    let isNewUser = false;
    if (!user) {
      user = await this.ds.getRepository(User).save({ phone, role, status: AccountStatus.Active });
      isNewUser = true;
      if (role === Role.Customer) await this.ds.getRepository(CustomerProfile).save({ userId: user.id, name: null, email: null, savedAddresses: [], notificationPrefs: {}, referralCode: null });
      if (role === Role.Driver) await this.ds.getRepository(DriverProfile).save({ userId: user.id, name: '', isOnline: false, onActiveTrip: false, cityId: null, isSimulated: false });
    }
    if (user.status !== AccountStatus.Active) throw new UnauthorizedException({ code: 'ACCOUNT_DISABLED', message: 'Account is not active' });
    return { isNewUser, user: { id: user.id, phone: user.phone, role: user.role }, ...(await this.issueTokens(user, randomUUID())) };
  }

  private async issueTokens(user: User, familyId: string): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role, phone: user.phone, typ: 'access' }, { expiresIn: ACCESS_TTL_S });
    const refreshToken = randomBytes(48).toString('base64url');
    await this.ds.getRepository(RefreshToken).save({
      userId: user.id, familyId, tokenHash: sha256(refreshToken), expiresAt: new Date(Date.now() + REFRESH_TTL_MS), revokedAt: null, rotatedAt: null,
    });
    return { accessToken, refreshToken, expiresIn: ACCESS_TTL_S };
  }

  /** Rotation: each refresh token is single-use. Re-presenting a used token revokes the whole family. */
  async refresh(refreshToken: string) {
    const repo = this.ds.getRepository(RefreshToken);
    const row = await repo.findOne({ where: { tokenHash: sha256(refreshToken) } });
    const bad = () => new UnauthorizedException({ code: 'REFRESH_INVALID', message: 'Session expired, please sign in again' });
    if (!row) throw bad();
    if (row.rotatedAt || row.revokedAt) {
      await repo.update({ familyId: row.familyId, revokedAt: IsNull() }, { revokedAt: new Date() }); // reuse detected
      throw bad();
    }
    if (row.expiresAt.getTime() < Date.now()) throw bad();
    const user = await this.ds.getRepository(User).findOne({ where: { id: row.userId } });
    if (!user || user.status !== AccountStatus.Active) throw bad();
    const claimed = await repo.update({ id: row.id, rotatedAt: IsNull() }, { rotatedAt: new Date() });
    if (!claimed.affected) throw bad();
    return this.issueTokens(user, row.familyId);
  }

  async logout(refreshToken: string) {
    const row = await this.ds.getRepository(RefreshToken).findOne({ where: { tokenHash: sha256(refreshToken) } });
    if (row) await this.ds.getRepository(RefreshToken).update({ familyId: row.familyId, revokedAt: IsNull() }, { revokedAt: new Date() });
    return { ok: true };
  }
}
