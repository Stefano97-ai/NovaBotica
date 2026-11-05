import { test } from 'node:test';
import assert from 'node:assert/strict';
import { serialError, purchaseError } from '../src/features/compras/domain/purchase.ts';

test('serial entry follows quantity changes without truncating saved numbers', () => {
  const series = [' A-1 ', 'A-2'];
  assert.equal(serialError(series, 2), '');
  assert.ok(serialError(series, 1)); assert.ok(serialError(series, 3));
  assert.ok(serialError(['A', ' A '], 2)); assert.ok(serialError([''], 1));
  assert.ok(serialError(['x'.repeat(161)], 1));
});
test('purchase checks cross-product duplicates and keeps ordinary products free of serial requirements', () => {
  const item = { id: '1', productoId: 1, codigo: 'P', descripcion: 'Test', unidadMedida: 'Unidad', cantidad: 1, precioUnitario: 5,
    lote: 'L', vencimiento: '2028-01-01', requiereSerie: true, series: ['S-1'] };
  assert.equal(purchaseError([item]), '');
  assert.ok(purchaseError([item, { ...item, id: '2', productoId: 2 }]));
  assert.ok(purchaseError([{ ...item, cantidad: 2 }]));
  assert.equal(purchaseError([{ ...item, requiereSerie: false, series: [] }]), '');
  assert.ok(purchaseError([{ ...item, cantidad: 1.5 }]));
});
