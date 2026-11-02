import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService, cookieToken } from './auth.service';
import { AuthRequest, Role } from './auth.types';

export const Public = () => SetMetadata('auth:public', true);
export const Roles = (...roles: Role[]) => SetMetadata('auth:roles', roles);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const response = context.switchToHttp().getResponse();
    response.setHeader('Cache-Control','no-store');
    response.setHeader('X-Content-Type-Options','nosniff');
    if (!['GET','HEAD','OPTIONS'].includes(request.method)) {
      const allowed = (process.env.APP_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173,http://127.0.0.1:3000').split(',').map(value=>value.trim());
      const origin = request.headers.origin;
      if (request.headers['x-nova-client'] !== 'web' || (origin && !allowed.includes(origin))) throw new ForbiddenException('Origen de solicitud no permitido.');
    }
    if (this.reflector.getAllAndOverride<boolean>('auth:public',[context.getHandler(),context.getClass()])) return true;
    request.user = await this.auth.authenticate(cookieToken(request.headers.cookie));
    const roles = this.reflector.getAllAndOverride<Role[]>('auth:roles',[context.getHandler(),context.getClass()]);
    if (roles && !roles.includes(request.user.rol)) throw new ForbiddenException('No tienes permiso para esta operación.');
    return true;
  }
}
