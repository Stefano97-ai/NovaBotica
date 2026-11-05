import { useEffect, useRef, useState } from 'react';
import { RefreshCw, RotateCcw, Search } from 'lucide-react';
import { ExportButtons } from '../../../../shared/presentation/export-buttons';
import type { ExportFormat } from '../../../../shared/domain/table-export';
import type { KardexSource } from '../../application/kardex-source';
import { emptyKardexFilters, formatKardexDate, movementNames, originNames, type KardexFilters, type KardexOptions, type KardexPage } from '../../domain/kardex';
import './kardex.css';

export function KardexPage({ source, initialProductId = '' }: { source: KardexSource; initialProductId?: string }) {
  const initialized = useRef(false);
  const [options, setOptions] = useState<KardexOptions | null>(null);
  const [draft, setDraft] = useState<KardexFilters>({...emptyKardexFilters,productoId:initialProductId});
  const [filters, setFilters] = useState<KardexFilters>({...emptyKardexFilters,productoId:initialProductId});
  const [productQuery, setProductQuery] = useState('');
  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [result, setResult] = useState<{ key: string; data: KardexPage } | null>(null);
  const [loading, setLoading] = useState(true);
  const [optionsError, setOptionsError] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [retry, setRetry] = useState(0);
  const key = JSON.stringify([filters,limit,offset]);
  const current = result?.key === key ? result.data : null;
  const productLabel = (p: KardexOptions['productos'][number]) => `${p.codigo} · ${p.nombre}`;
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    const timer = setTimeout(() => controller.abort(),15000);
    setOptionsError('');
    source.options(controller.signal).then(data => { if (active) {
      setOptions(data);
      if (!initialized.current) {
        const product=data.productos.find(p=>String(p.id)===initialProductId);
        if (product) setProductQuery(productLabel(product));
        initialized.current=true;
      }
    } })
      .catch(() => { if (active) setOptionsError('No pudimos cargar los productos, lotes y responsables. Pulsa Actualizar para reintentar.'); })
      .finally(() => clearTimeout(timer));
    return () => { active=false; clearTimeout(timer); controller.abort(); };
  }, [source,retry]);
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    const timer = setTimeout(() => controller.abort(),20000);
    setLoading(true); setError('');
    source.list(filters,limit,offset,controller.signal).then(data => {
      if (!active) return;
      if (offset > 0 && offset >= data.total) { setOffset(Math.max(0,Math.floor((data.total-1)/limit)*limit)); return; }
      setResult({key,data});
    }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'No se pudo consultar Kardex.'); })
      .finally(() => { clearTimeout(timer); if (active) setLoading(false); });
    return () => { active=false; clearTimeout(timer); controller.abort(); };
  }, [source,key,retry]);
  function change(patch: Partial<KardexFilters>) { setDraft(old => ({...old,...patch})); setFormError(''); }
  function apply(event: React.FormEvent) {
    event.preventDefault();
    const product = options?.productos.find(p => productLabel(p) === productQuery.trim());
    if (productQuery.trim() && !product) { setFormError('Selecciona un producto de las sugerencias por nombre o código.'); return; }
    if (draft.desde && draft.hasta && draft.desde > draft.hasta) { setFormError('La fecha inicial no puede superar la fecha final.'); return; }
    setFilters({...draft,productoId:product ? String(product.id) : ''}); setOffset(0); setFormError('');
  }
  function clear() { setDraft(emptyKardexFilters); setFilters(emptyKardexFilters); setProductQuery(''); setOffset(0); setFormError(''); }
  async function exportFile(format:ExportFormat) {
    setExporting(true); setError('');
    try { await source.export(filters,format); } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo exportar Kardex.'); }
    finally { setExporting(false); }
  }
  return <section className="inv-card kardex-real" aria-labelledby="kardex-title">
    <header className="inv-header-row">
      <button type="button" className="kardex-control" onClick={() => setRetry(n=>n+1)} disabled={loading}><RefreshCw size={15} />Actualizar</button></header>
    <form className="kardex-filter-form" onSubmit={apply}>
      <label className="kardex-product-search">Producto<input list="kardex-products" placeholder="Todos · busca por código o nombre" value={productQuery} onChange={e => {
        setProductQuery(e.target.value); const product=options?.productos.find(p=>productLabel(p)===e.target.value);
        change({productoId:product?String(product.id):'',loteId:''});
      }} disabled={!options} /><datalist id="kardex-products">{options?.productos.map(p=><option key={p.id} value={productLabel(p)} />)}</datalist></label>
      <label>Desde<input type="date" value={draft.desde} onChange={e=>change({desde:e.target.value})} /></label>
      <label>Hasta<input type="date" value={draft.hasta} onChange={e=>change({hasta:e.target.value})} /></label>
      <label>Lote<select value={draft.loteId} onChange={e=>change({loteId:e.target.value})} disabled={!options}><option value="">Todos los lotes</option>{options?.lotes.filter(l=>!draft.productoId || String(l.productoId)===draft.productoId).map(l=><option key={l.id} value={l.id}>{l.nombre}{!draft.productoId ? ` · ${options.productos.find(p=>p.id===l.productoId)?.codigo ?? ''}` : ''}</option>)}</select></label>
      <label>Tipo de movimiento<select value={draft.tipo} onChange={e=>change({tipo:e.target.value})}><option value="">Todos</option>{Object.entries(movementNames).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
      <label>Origen<select value={draft.origen} onChange={e=>change({origen:e.target.value})}><option value="">Todos</option>{Object.entries(originNames).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
      <label>Responsable<select value={draft.usuarioId} onChange={e=>change({usuarioId:e.target.value})} disabled={!options}><option value="">Todos</option>{options?.usuarios.map(u=><option key={u.id} value={u.id}>{u.nombre} ({u.username})</option>)}</select></label>
      <label>Documento o referencia<input maxLength={160} value={draft.referencia} onChange={e=>change({referencia:e.target.value})} placeholder="Referencia, motivo o número" /></label>
      <div className="kardex-filter-actions"><button type="submit" className="kardex-control kardex-primary" disabled={!options}><Search size={15} />Consultar</button><button type="button" className="kardex-control" onClick={clear}><RotateCcw size={15} />Limpiar filtros</button></div>
    </form>
    {(error || optionsError || formError) && <div className="kardex-error" role="alert">{formError || optionsError || error}{error && current && ' Se conservan los últimos resultados de esta consulta.'}</div>}
    {current && current.noVerificables>0 && <p className="kardex-warning" role="status">{current.noVerificables} movimientos tienen saldos históricos no verificables. Se muestran sus entradas y salidas reales sin inventar un saldo inicial.</p>}
    <div className="kardex-toolbar"><p role="status">{loading ? 'Consultando movimientos…' : current ? `${current.total} movimientos encontrados` : 'Sin resultados actualizados'}</p>
      <ExportButtons busy={exporting} disabled={loading||!current?.total} onExport={format=>void exportFile(format)}/>
    </div>
    <div className="kardex-table-wrap" aria-busy={loading}><table className="kardex-table"><caption className="kardex-table-caption">Entradas, salidas y saldos por lote · filtros de la última consulta aplicada</caption>
      <thead><tr className="kardex-cols-row"><th>FECHA (LIMA)</th><th>PRODUCTO / LOTE</th><th>MOVIMIENTO / REFERENCIA</th><th>RESPONSABLE</th><th>SALDO ANTERIOR DEL LOTE</th><th>ENTRADA</th><th>SALIDA</th><th>SALDO POSTERIOR DEL LOTE</th></tr></thead>
      <tbody>{current?.items.map(row=><tr key={row.id}>
        <td><time dateTime={row.fecha}>{formatKardexDate(row.fecha)}</time></td>
        <td><strong>{row.codigo} · {row.producto}</strong><small>Lote {row.lote}</small></td>
        <td><strong>{movementNames[row.tipo] ?? row.tipo} · {originNames[row.origen] ?? row.origen}</strong><small>{row.referencia}</small><small>{row.motivo}</small></td>
        <td>{row.responsable}</td><td className="kardex-balance">{row.saldoAnterior ?? 'No verificable'}</td>
        <td className="kardex-num-entrada">{row.entrada ? `+${row.entrada}` : '—'}</td><td className="kardex-num-salida">{row.salida ? `−${row.salida}` : '—'}</td>
        <td className="kardex-balance">{row.saldoPosterior ?? 'No verificable'}{row.verificacion==='RECONSTRUIDO' && <small>Reconstruido y conciliado</small>}</td>
      </tr>)}{!current && <tr><td colSpan={8}>{loading ? 'Cargando movimientos reales…' : 'Actualiza para volver a consultar los movimientos.'}</td></tr>}
      {current?.items.length===0 && <tr><td colSpan={8}>No hay movimientos para los filtros seleccionados.</td></tr>}</tbody>
    </table></div>
    <nav className="kardex-pagination" aria-label="Paginación de Kardex"><label>Por página<select value={limit} onChange={e=>{setLimit(Number(e.target.value));setOffset(0);}}>{[10,25,50,100].map(n=><option key={n}>{n}</option>)}</select></label>
      <span>{current ? `${current.total?offset+1:0}–${offset+current.items.length} de ${current.total}` : '—'}</span>
      <button type="button" className="kardex-control" disabled={loading || offset===0} onClick={()=>setOffset(n=>Math.max(0,n-limit))}>Anterior</button>
      <button type="button" className="kardex-control" disabled={loading || !current || offset+limit>=current.total} onClick={()=>setOffset(n=>n+limit)}>Siguiente</button>
    </nav>
  </section>;
}
