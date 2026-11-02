import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { AuthRepository } from './auth.repository';
import { hashPassword, verifyPassword } from './password';

export const SESSION_COOKIE = 'nova_session';
export const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
export function cookieToken(cookie: string | undefined): string | undefined {
  const value = cookie?.split(';').map(part => part.trim()).find(part => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length+1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : undefined;
}
@Injectable()
export class AuthService {
  private readonly dummyHash = hashPassword(randomBytes(32).toString('hex'));
  constructor(private readonly repository: AuthRepository) {}

  async login(username: string, password: string, ip: string, oldToken?: string) {
    const normalized = username.trim().toLowerCase();
    const ipAttempts = await this.repository.consumeAttempt(tokenHash(`ip:${ip}`));
    if (ipAttempts > 30) throw new HttpException('Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.', HttpStatus.TOO_MANY_REQUESTS);
    const attempts = await this.repository.consumeAttempt(tokenHash(`account:${normalized}`));
    if (attempts > 10) throw new HttpException('Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.', HttpStatus.TOO_MANY_REQUESTS);
    const user = await this.repository.findUser(normalized);
    const supportedHash = user?.password_hash.startsWith('scrypt-v1$') ? user.password_hash : await this.dummyHash;
    const valid = await verifyPassword(password, supportedHash);
    if (!user || !user.activo || !valid || !user.password_hash.startsWith('scrypt-v1$')) throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    const token = randomBytes(32).toString('hex');
    if (!await this.repository.createSession(user.id, tokenHash(token), oldToken ? tokenHash(oldToken) : undefined)) throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    return { token, user: { id:user.id, username:user.username, nombre:user.nombre, rol:user.rol } };
  }
  async authenticate(token?: string) {
    const user = token ? await this.repository.findSession(tokenHash(token)) : undefined;
    if (!user) throw new UnauthorizedException('Tu sesión terminó. Inicia sesión para continuar.');
    return user;
  }
  async logout(token?: string) { if (token) await this.repository.deleteSession(tokenHash(token)); }
}
