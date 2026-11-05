export interface KardexFilters {
  productoId: string; loteId: string; desde: string; hasta: string; tipo: string; origen: string; usuarioId: string; referencia: string;
}
export const emptyKardexFilters: KardexFilters = { productoId: '', loteId: '', desde: '', hasta: '', tipo: '', origen: '', usuarioId: '', referencia: '' };
export interface KardexRow {
  id: number; productoId: number; codigo: string; producto: string; loteId: number; lote: string; fecha: string;
  tipo: string; origen: string; usuarioId: number; responsable: string; motivo: string; referencia: string;
  saldoAnterior: number | null; entrada: number; salida: number; saldoPosterior: number | null;
  verificacion: 'REGISTRADO' | 'RECONSTRUIDO' | 'NO_VERIFICABLE';
}
export interface KardexPage { items: KardexRow[]; total: number; noVerificables: number; limit: number; offset: number }
export interface KardexOptions {
  productos: { id: number; codigo: string; nombre: string }[];
  lotes: { id: number; productoId: number; nombre: string }[];
  usuarios: { id: number; nombre: string; username: string }[];
}
export const originNames: Record<string,string> = { VENTA: 'Venta', RECEPCION_LOTE: 'Compra (recepción)', MANUAL: 'Registro manual' };
export const movementNames: Record<string,string> = { ENTRADA: 'Entrada', SALIDA: 'Salida', AJUSTE: 'Ajuste' };
export const formatKardexDate = (date: string) => new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', dateStyle: 'short', timeStyle: 'medium' }).format(new Date(date));
