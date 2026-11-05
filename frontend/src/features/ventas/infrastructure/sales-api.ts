import type { LoadSerials } from '../domain/series';

export async function salesRequest<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json', 'X-Nova-Client': 'web' },
    body: body === undefined ? undefined : JSON.stringify(body), signal: signal ?? AbortSignal.timeout(20000),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(typeof result.message === 'string' ? result.message : 'No se pudo completar la solicitud. Vuelve a intentarlo.');
    Object.assign(error, { status: response.status });
    throw error;
  }
  return result as T;
}
export const loadSerials: LoadSerials = (productId, quantity, signal) => salesRequest(`/productos/${productId}/series?cantidad=${quantity}`, undefined, signal);

export interface SaleCustomer { id: number; tipoDocumento: string; numeroDocumento: string; nombre: string; direccion?: string; telefono?: string }
export async function resolveCustomer(type: string, number: string, name: string, address: string, phone: string) {
  if (type === 'SIN DOCUMENTO') return null;
  try { return await salesRequest<SaleCustomer>(`/clientes/buscar?tipo=${encodeURIComponent(type)}&numero=${encodeURIComponent(number.trim())}`); }
  catch (error) {
    if ((error as { status?: number }).status !== 404) throw error;
    try {
      return await salesRequest<SaleCustomer>('/clientes', { tipoDocumento: type, numeroDocumento: number.trim(), nombre: name.trim(), direccion: address.trim(), telefono: phone.trim() });
    } catch (creationError) {
      // A concurrent creation can win; reuse it without changing the existing identity.
      if ([400, 409].includes((creationError as { status?: number }).status ?? 0))
        return salesRequest<SaleCustomer>(`/clientes/buscar?tipo=${encodeURIComponent(type)}&numero=${encodeURIComponent(number.trim())}`);
      throw creationError;
    }
  }
}
