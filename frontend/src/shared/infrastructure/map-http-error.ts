import { ApplicationError, type FailureCode } from '../application/errors';
import { HttpError } from './http-client';
const codes: Record<number, FailureCode> = { 400: 'invalid', 401: 'unauthorized', 403: 'forbidden', 429: 'rate-limit' };
export function mapHttpError(error: unknown, messages: Partial<Record<FailureCode, string>> = {}): ApplicationError {
  const code = error instanceof HttpError ? codes[error.status] ?? 'unavailable' : 'network';
  return new ApplicationError(code, messages[code] ?? 'El servicio no está disponible. Inténtalo de nuevo en un momento.');
}
