import { test } from 'node:test';
import assert from 'node:assert/strict';
import { alertDescription, alertTarget, alertTypeLabels } from '../src/features/alertas/domain/alert.ts';

const alert = { tipo: 'POR_VENCER', datos: { codigo: 'A&B 1', lote: 'L001', unidades: 4, dias: 1 } };
test('notification text uses the actual stock and expiry snapshot, including today and expired units', () => {
  assert.match(alertDescription(alert), /Vence en 1 día\./);
  assert.match(alertDescription({ ...alert, datos: { ...alert.datos, dias: 0 } }), /Vence hoy/);
  assert.match(alertDescription({ ...alert, datos: { ...alert.datos, dias: -1 } }), /Vencido hace 1 día\./);
  assert.match(alertDescription({ ...alert, tipo: 'STOCK_BAJO', datos: { stock: 3, minimo: 10 } }), /3 unidades.*10/);
  assert.match(alertDescription({ ...alert, tipo: 'AGOTADO', datos: { minimo: 10 } }), /Sin stock vendible/);
});
test('product navigation encodes the exact code and every supported alert has a human label', () => {
  assert.equal(alertTarget(alert), '/productos?buscar=A%26B%201');
  for (const type of ['STOCK_BAJO', 'AGOTADO', 'POR_VENCER', 'VENCIMIENTO_URGENTE', 'VENCIDO']) assert.ok(alertTypeLabels[type]);
});
