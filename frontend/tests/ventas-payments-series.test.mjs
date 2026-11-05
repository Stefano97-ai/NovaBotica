import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cents, paymentError, paidCents, syncPaymentTotal } from '../src/features/ventas/domain/payment.ts';
import { canSelectSerial } from '../src/features/ventas/domain/series.ts';
const row = (monto, metodo = 'Efectivo') => ({ id: crypto.randomUUID(), metodo, monto, referencia: '' });
test('split payments reconcile in cents and reject incomplete, excessive and invalid amounts', () => {
  assert.equal(paymentError([row('8.00'), row('2.00', 'Yape')], 10), '');
  assert.ok(paymentError([row('8.00'), row('1.00')], 10));
  assert.ok(paymentError([row('8.00'), row('3.00')], 10));
  assert.ok(paymentError([row('10'), row('0')], 10));
  assert.ok(paymentError([row('-1')], 1));
  assert.ok(paymentError([row('1.001')], 1));
  assert.equal(paidCents([row('0.10'), row('0.20')]), 30);
  assert.ok(Number.isNaN(cents('')));
});
test('changing a cart total keeps first allocations and adjusts the last payment', () => {
  const result = syncPaymentTotal([row('8'), row('2', 'Yape')], 15);
  assert.equal(result[0].monto, '8'); assert.equal(result[1].monto, '7.00');
  assert.equal(syncPaymentTotal([row('8')], 20)[0].monto, '20.00');
});
test('series remain optional and selection is bounded by quantity and FEFO lot allocation', () => {
  const unit = { id: 1, loteId: 10, numeroSerie: 'A', numeroLote: 'L', vencimiento: '2027-01-01', limiteLote: 1 };
  assert.equal(canSelectSerial(unit, [], 2), true);
  assert.equal(canSelectSerial({ ...unit, id: 2 }, [unit], 2), false);
  assert.equal(canSelectSerial({ ...unit, id: 3, loteId: 20, limiteLote: 0 }, [], 2), false);
  assert.equal(canSelectSerial({ ...unit, id: 2, loteId: 20 }, [unit], 1), false);
});
