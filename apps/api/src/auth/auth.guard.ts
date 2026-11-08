import {
  CanActivate, createParamDecorator, ExecutionContext, ForbiddenException, Injectable, SetMetadata, UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../database/entities';

export interface AuthUser {
  id: string;
  role: Role;
  phone: string;
}

export const ROLES_KEY = 'roles';
export const PUBLIC_KEY = 'isPublic';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
export const Public = () => SetMetadata(PUBLIC_KEY, true);
export const CurrentUser = createParamDecorator((_d, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user);

/** Staff = any back-office role. */
export const STAFF_ROLES = [Role.Admin, Role.OpsManager, Role.Support];

/**
 * Global guard: every route requires a valid access token unless @Public().
 * If @Roles() is present the user's role (from the signed token) must match.
 * Roles are enforced here on the backend, independent of any UI hiding.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwt: JwtService, private reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, targets);

    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers['authorization'];
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

    if (token) {
      try {
        const payload: any = await this.jwt.verifyAsync(token);
        if (payload.typ === 'access') {
          req.user = { id: payload.sub, role: payload.role, phone: payload.phone } as AuthUser;
        }
      } catch {
        if (!isPublic) {
          throw new UnauthorizedException({ code: 'TOKEN_INVALID', message: 'Access token invalid or expired' });
        }
      }
    }

    if (isPublic) return true;
    if (!token || !req.user) throw new UnauthorizedException({ code: 'AUTH_REQUIRED', message: 'Missing access token' });

    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, targets);
    if (required?.length && !required.includes(req.user.role)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Insufficient role for this resource' });
    }
    return true;
  }
}
