export type AlertType = 'STOCK_BAJO' | 'AGOTADO' | 'POR_VENCER' | 'VENCIMIENTO_URGENTE' | 'VENCIDO';
export type AlertPriority = 'MEDIA' | 'ALTA' | 'CRITICA';
export interface Alert {
  id: string; tipo: AlertType; prioridad: AlertPriority; estado: 'ACTIVA' | 'RESUELTA';
  productoId: string | null; loteId: string | null;
  datos: { producto: string; codigo: string; stock?: number; minimo?: number; lote?: string; unidades?: number; vencimiento?: string; dias?: number; productoId?: string };
  version: number; leida: boolean; creadaEn: string; actualizadaEn: string; resueltaEn: string | null;
}
export interface AlertFilters {
  estado: 'ACTIVA' | 'RESUELTA' | 'TODAS'; tipo: AlertType | 'TODAS'; prioridad: AlertPriority | 'TODAS';
  noLeidas: boolean; limit: number; offset: number;
}
export interface AlertsPage { items: Alert[]; total: number; unreadCount: number; limit: number; offset: number; checkedAt: string }
export const defaultFilters: AlertFilters = { estado: 'ACTIVA', tipo: 'TODAS', prioridad: 'TODAS', noLeidas: false, limit: 25, offset: 0 };
export const alertTypeLabels: Record<AlertType, string> = {
  STOCK_BAJO: 'Stock por reponer', AGOTADO: 'Producto agotado', POR_VENCER: 'Próximo a vencer',
  VENCIMIENTO_URGENTE: 'Vencimiento urgente', VENCIDO: 'Lote vencido',
};
export function alertDescription(alert: Alert) {
  const data = alert.datos;
  if (alert.tipo === 'AGOTADO') return `Sin stock vendible. Mínimo configurado: ${data.minimo ?? 0} unidades.`;
  if (alert.tipo === 'STOCK_BAJO') return `Stock vendible: ${data.stock ?? 0} unidades. Mínimo: ${data.minimo ?? 0}.`;
  const days = data.dias ?? 0;
  const expiry = days < 0 ? `Vencido hace ${Math.abs(days)} ${days === -1 ? 'día' : 'días'}` : days === 0 ? 'Vence hoy' : `Vence en ${days} ${days === 1 ? 'día' : 'días'}`;
  return `Lote ${data.lote} · ${data.unidades ?? 0} unidades. ${expiry}.`;
}
export function alertTarget(alert: Alert) { return `/productos?buscar=${encodeURIComponent(alert.datos.codigo)}`; }
