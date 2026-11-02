import type { AuthRepository } from '../domain/auth-repository';
import type { User } from '../../../shared/domain/user';
import type { HttpClient } from '../../../shared/infrastructure/http-client';
import { mapHttpError } from '../../../shared/infrastructure/map-http-error';
const messages = {
  invalid: 'Revisa tu usuario y contraseña.', unauthorized: 'Usuario o contraseña incorrectos.',
  forbidden: 'No se pudo validar la solicitud. Recarga la página e inténtalo otra vez.',
  'rate-limit': 'Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.',
  network: 'No pudimos conectar. Comprueba tu conexión y vuelve a intentarlo.',
};
export function createHttpAuthRepository(http: HttpClient): AuthRepository {
  async function execute<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation(); } catch (error) { throw mapHttpError(error, messages); }
  }
  return {
    currentUser: signal => execute(async () => (await http.request<{user: User}>('auth/me', { signal })).user),
    login: credentials => execute(async () => (await http.request<{user: User}>('auth/login', { method: 'POST', body: credentials })).user),
    logout: () => execute(() => http.request<void>('auth/logout', { method: 'POST', body: {} })),
  };
}
