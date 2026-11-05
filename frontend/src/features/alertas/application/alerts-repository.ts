import type { AlertFilters, AlertsPage } from '../domain/alert';

export interface AlertsRepository {
  list(filters: AlertFilters, signal?: AbortSignal): Promise<AlertsPage>;
  read(id: string, version: number): Promise<void>;
  readAll(): Promise<void>;
}
export class AlertsError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}
