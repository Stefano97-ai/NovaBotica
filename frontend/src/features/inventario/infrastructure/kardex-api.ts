import type { KardexSource } from '../application/kardex-source';
import { formatKardexDate, type KardexFilters, type KardexOptions, type KardexPage, type KardexRow } from '../domain/kardex';
import { downloadTable } from '../../../shared/infrastructure/table-export';

function params(filters: KardexFilters) { return new URLSearchParams(Object.entries(filters).filter(([,value]) => value.trim() !== '').map(([key,value]) => [key,value.trim()])); }
async function request(path: string, signal?: AbortSignal) {
  const response = await fetch(`/api/inventario/kardex${path}`, { credentials: 'same-origin', cache: 'no-store', signal: signal ?? AbortSignal.timeout(30000) });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || 'No se pudo consultar Kardex. Vuelve a intentarlo.');
  }
  return response;
}
export const kardexSource: KardexSource = {
  async options(signal) { return (await request('/opciones',signal)).json() as Promise<KardexOptions>; },
  async list(filters, limit, offset, signal) {
    const query = params(filters); query.set('limit',String(limit)); query.set('offset',String(offset));
    return (await request(`?${query}`,signal)).json() as Promise<KardexPage>;
  },
  async export(filters,format) {
    const rows:KardexRow[]=await (await request(`/datos-exportacion?${params(filters)}`)).json();
    await downloadTable({title:'Kardex',subtitle:`Saldos por lote · Hora de Lima · Filtros: ${params(filters).toString()||'Todos'} · ${rows.length} movimientos`,
      columns:[{key:'fecha',label:'Fecha (Lima)'},{key:'codigo',label:'Código'},{key:'producto',label:'Producto'},{key:'lote',label:'Lote'},{key:'tipo',label:'Tipo'},{key:'referencia',label:'Referencia'},{key:'responsable',label:'Responsable'},{key:'saldoAnterior',label:'Saldo anterior',format:'number'},{key:'entrada',label:'Entrada',format:'number'},{key:'salida',label:'Salida',format:'number'},{key:'saldoPosterior',label:'Saldo posterior',format:'number'},{key:'verificacion',label:'Verificación'}],
      rows:rows.map(row=>({...row,fecha:formatKardexDate(row.fecha)}))},format,'nova-kardex');
  },
};
