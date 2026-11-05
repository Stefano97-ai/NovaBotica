import { AlertsError, type AlertsRepository } from '../application/alerts-repository';

async function request<T>(path: string, method: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/alertas${path}`, {
    method, credentials: 'same-origin', cache: 'no-store', signal: signal ?? AbortSignal.timeout(15000),
    headers: body === undefined ? {} : { 'Content-Type': 'application/json', 'X-Nova-Client': 'web' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new AlertsError(response.status, error.message ?? 'No pudimos consultar las alertas. Vuelve a intentarlo.');
  }
  return response.status === 204 ? undefined as T : response.json();
}
export const alertsRepository: AlertsRepository = {
  list: (filters, signal) => request(`?${new URLSearchParams(Object.entries(filters).map(([key, value]) => [key, String(value)]))}`, 'GET', undefined, signal),
  read: (id, version) => request(`/${encodeURIComponent(id)}/lectura`, 'PUT', { version }),
  readAll: () => request('/lecturas', 'PUT'),
};
