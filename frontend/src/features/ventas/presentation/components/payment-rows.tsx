import { FaCalculator } from 'react-icons/fa6';
import { X } from 'lucide-react';
import { cents, paidCents, type PaymentRow } from '../../domain/payment';

export function PaymentRows({ rows, total, onChange, onAdd, onRemove, onChangeCalculator, disabled }: {
  rows: PaymentRow[]; total: number; onChange: (id: string, patch: Partial<PaymentRow>) => void;
  onAdd: () => void; onRemove: (id: string) => void; onChangeCalculator: () => void; disabled: boolean;
}) {
  const pending = Math.round(total * 100) - paidCents(rows);
  const incomplete = rows.some(row => !Number.isFinite(cents(row.monto)) || cents(row.monto) <= 0);
  return <section className="pos-payment-block" aria-label="Métodos de pago">
    <div className="pos-payment-heading"><h4 className="pos-section-label">MÉTODOS DE PAGO:</h4>
      <div className="pos-pay-actions-row">
        <button type="button" className="pos-vuelto-btn" onClick={onChangeCalculator}><FaCalculator size={12} /> Vuelto / Cambio</button>
        <button type="button" className="pos-add-pay-btn" onClick={onAdd} disabled={disabled || rows.length >= 20}>+ Agregar Pago</button>
      </div>
    </div>
    {rows.map((row, index) => <div className="pos-split-pay-row" key={row.id}>
      <select className="pos-pay-select" aria-label={`Método de pago ${index + 1}`} value={row.metodo} disabled={disabled} onChange={e => onChange(row.id, { metodo: e.target.value })}>
        {['Efectivo', 'Yape', 'Plin', 'Tarjeta Débito', 'Tarjeta Crédito', 'Transferencia'].map(method => <option key={method}>{method}</option>)}
      </select>
      <input className="pos-pay-amount" type="number" min="0.01" step="0.01" inputMode="decimal" aria-label={`Monto del pago ${index + 1}`} value={row.monto} disabled={disabled} onChange={e => onChange(row.id, { monto: e.target.value })} />
      <input className="pos-pay-reference" type="text" maxLength={160} aria-label={`Referencia del pago ${index + 1}`} placeholder="Ref/Op" value={row.referencia} disabled={disabled} onChange={e => onChange(row.id, { referencia: e.target.value })} />
      {index > 0 ? <button className="pos-remove-payment" type="button" aria-label={`Quitar pago ${index + 1}`} disabled={disabled} onClick={() => onRemove(row.id)}><X size={15} /></button> : <span aria-hidden="true" />}
    </div>)}
    <p className={`pos-payment-balance ${pending !== 0 || incomplete ? 'is-pending' : ''}`} aria-live="polite">
      {pending === 0 && incomplete ? 'Completa el monto de cada método de pago.' : `${pending === 0 ? 'Pagos completos' : pending > 0 ? 'Pendiente de distribuir' : 'Exceso asignado'}: S/ ${(Math.abs(pending) / 100).toFixed(2)}`}
    </p>
  </section>;
}
