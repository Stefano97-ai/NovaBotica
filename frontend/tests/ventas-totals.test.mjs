import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateSaleTotals } from '../src/features/ventas/domain/sale-totals.ts';

test('empty cart has no charge or tax', () => {
  assert.deepEqual(calculateSaleTotals([]), { subtotal: 0, igv: 0, total: 0 });
});

test('catalog prices include IGV and are multiplied by quantity without discounts', () => {
  assert.deepEqual(calculateSaleTotals([{ precioUnitario: 11.8, cantidad: 3 }]), {
    subtotal: 30, igv: 5.4, total: 35.4,
  });
});

test('rounds IGV per line to match the backend, rather than dividing the cart grand total', () => {
  assert.deepEqual(calculateSaleTotals([
    { precioUnitario: 1, cantidad: 1 }, { precioUnitario: 1, cantidad: 1 },
  ]), { subtotal: 1.7, igv: 0.3, total: 2 });
});

test('fractional prices reconcile to the total in cents', () => {
  const result = calculateSaleTotals([
    { precioUnitario: 6.9, cantidad: 3 }, { precioUnitario: 2.8, cantidad: 2 },
  ]);
  assert.equal(result.total, 26.3);
  assert.equal(Math.round(result.subtotal * 100) + Math.round(result.igv * 100), 2630);
});
