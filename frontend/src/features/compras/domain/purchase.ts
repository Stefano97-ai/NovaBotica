export interface PurchaseProduct {
  id: number; codigo: string; nombre: string; unidad: string; costoDefecto: number; requiereSerie: boolean;
}
export interface PurchaseItem {
  id: string; productoId: number; codigo: string; descripcion: string; unidadMedida: string;
  cantidad: number; precioUnitario: number; lote: string; vencimiento: string;
  requiereSerie: boolean; series: string[];
}
export interface PurchaseSupplier { id: number; ruc: string; razonSocial: string; direccion: string; telefono: string; activo: boolean }
export interface PurchaseCategory { id: number; nombre: string }

export function serialError(series: string[], quantity: number): string {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) return 'La cantidad debe ser un entero entre 1 y 10000.';
  if (series.length !== quantity) return `Registra ${quantity} series, una por cada unidad.`;
  const normalized = series.map(s => s.trim());
  if (normalized.some(s => !s || s.length > 160)) return 'Cada serie debe tener entre 1 y 160 caracteres.';
  if (new Set(normalized).size !== normalized.length) return 'No se puede repetir una serie.';
  return '';
}

export function purchaseError(items: PurchaseItem[]): string {
  if (!items.length) return 'Agrega al menos un producto a la compra.';
  const all = new Set<string>();
  for (const item of items) {
    if (!Number.isInteger(item.cantidad) || item.cantidad < 1 || item.cantidad > 10000) return `Revisa la cantidad de ${item.descripcion}.`;
    if (!item.lote.trim() || !item.vencimiento || !Number.isFinite(item.precioUnitario) || item.precioUnitario < 0) return `Completa lote, vencimiento y costo de ${item.descripcion}.`;
    if (item.requiereSerie) {
      const error = serialError(item.series, item.cantidad);
      if (error) return `${item.descripcion}: ${error}`;
      for (const serial of item.series) {
        if (all.has(serial.trim())) return 'Una serie está repetida en distintos productos de la compra.';
        all.add(serial.trim());
      }
    }
  }
  return '';
}
