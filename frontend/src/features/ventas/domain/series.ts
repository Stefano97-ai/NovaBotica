export interface AvailableSerial {
  id: number; loteId: number; numeroSerie: string; numeroLote: string; vencimiento: string; limiteLote: number;
}
export type LoadSerials = (productId: number, quantity: number, signal: AbortSignal) => Promise<AvailableSerial[]>;

export function canSelectSerial(unit: AvailableSerial, selected: readonly AvailableSerial[], quantity: number) {
  return selected.length < quantity && selected.filter(s => s.loteId === unit.loteId).length < unit.limiteLote;
}
