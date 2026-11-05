import type { PurchaseCategory, PurchaseItem, PurchaseProduct, PurchaseSupplier } from '../domain/purchase';

async function request<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json', 'X-Nova-Client': 'web' },
    body: body === undefined ? undefined : JSON.stringify(body), signal: signal ?? AbortSignal.timeout(20000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.message === 'string' ? data.message : 'No se pudo completar la solicitud.');
  return data as T;
}

interface ProductDto { id: number; codigo: string; nombre: string; unidadBase: string; precioVenta: number; requiereSerie: boolean; activo: boolean }
const mapProduct = (p: ProductDto): PurchaseProduct => ({ id: p.id, codigo: p.codigo, nombre: p.nombre, unidad: p.unidadBase, costoDefecto: 0, requiereSerie: p.requiereSerie });
export async function loadPurchaseCatalog(signal?: AbortSignal) {
  const [products, suppliers, categories] = await Promise.all([
    request<ProductDto[]>('/productos', undefined, signal), request<PurchaseSupplier[]>('/proveedores', undefined, signal),
    request<PurchaseCategory[]>('/categorias', undefined, signal),
  ]);
  return { products: products.filter(p => p.activo).map(mapProduct), suppliers: suppliers.filter(p => p.activo), categories };
}
export async function createPurchaseProduct(body: { categoriaId: number; codigo: string; nombre: string; unidadBase: string; precioVenta: number; requiereSerie: boolean }) {
  return mapProduct(await request<ProductDto>('/productos', { ...body, stockMinimo: 0 }));
}
export function registerPurchase(proveedorId: number, items: PurchaseItem[]) {
  return request<{ id: number; estado: string }>('/compras/registro', {
    proveedorId, items: items.map(i => ({ productoId: i.productoId, cantidad: i.cantidad, costoUnitario: i.precioUnitario,
      numeroLote: i.lote.trim(), fechaVencimiento: i.vencimiento, series: i.requiereSerie ? i.series.map(s => s.trim()) : [] })),
  });
}
