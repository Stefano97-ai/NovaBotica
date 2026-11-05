export interface PaymentRow { id: string; metodo: string; monto: string; referencia: string }

export function cents(value: string) {
  return /^\d+(\.\d{0,2})?$/.test(value) ? Math.round(Number(value) * 100) : NaN;
}
export function paidCents(rows: readonly PaymentRow[]) {
  return rows.reduce((sum, row) => sum + (Number.isFinite(cents(row.monto)) ? cents(row.monto) : 0), 0);
}
export function syncPaymentTotal(rows: readonly PaymentRow[], total: number): PaymentRow[] {
  const remaining = Math.max(0, Math.round(total * 100) - paidCents(rows.slice(0, -1)));
  return rows.map((row, index) => index === rows.length - 1 ? { ...row, monto: (remaining / 100).toFixed(2) } : row);
}
export function paymentError(rows: readonly PaymentRow[], total: number) {
  if (!rows.length || rows.some(row => !row.metodo || !Number.isFinite(cents(row.monto)) || cents(row.monto) <= 0))
    return 'Cada método de pago debe tener un monto mayor a cero y como máximo dos decimales.';
  if (paidCents(rows) !== Math.round(total * 100)) return 'La suma de los pagos debe coincidir exactamente con el total de la venta.';
  return '';
}
