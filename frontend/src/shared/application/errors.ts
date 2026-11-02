export type FailureCode = 'unauthorized' | 'forbidden' | 'invalid' | 'rate-limit' | 'unavailable' | 'network';
export class ApplicationError extends Error {
  constructor(public readonly code: FailureCode, message: string) { super(message); }
}
export const isUnauthorized = (error: unknown): boolean =>
  error instanceof ApplicationError && error.code === 'unauthorized';
