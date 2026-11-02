export interface ExpiringLot { id: string; producto: string; lote: string; vencimiento: string; unidades: number }
export interface Summary {
  updatedAt: string; products: number; lowStock: number; expired: number; expiringCount: number;
  expiring: ExpiringLot[]; sales: { count: number; total: string } | null;
}
export interface SummaryRepository { getSummary(signal?: AbortSignal): Promise<Summary> }
