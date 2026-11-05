import { useEffect, useState } from 'react';
import { Bell, RefreshCw, CheckCheck } from 'lucide-react';
import { useAlerts } from '../alerts-context';
import { AlertItem } from '../components/alert-item';
import { alertTypeLabels, defaultFilters, type Alert, type AlertFilters, type AlertsPage } from '../../domain/alert';
import '../alerts.css';

export default function AlertasPage() {
  const { source, version, preview, refresh, read, readAll } = useAlerts();
  const [filters, setFilters] = useState<AlertFilters>(defaultFilters);
  const [result, setResult] = useState<{ key: string; data: AlertsPage } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const key = JSON.stringify(filters);
  const current = result?.key === key ? result.data : null;
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    const timer = setTimeout(() => controller.abort(), 15000);
    setLoading(true); setError('');
    source.list(filters, controller.signal).then(data => {
      if (!active) return;
      if (filters.offset > 0 && filters.offset >= data.total) {
        setFilters(old => JSON.stringify(old) === key ? { ...old, offset: Math.max(0, Math.floor((data.total - 1) / old.limit) * old.limit) } : old);
        return;
      }
      setResult({ key, data });
    })
      .catch(() => { if (active) setError('No pudimos actualizar la lista. Reintenta la consulta.'); })
      .finally(() => { clearTimeout(timer); if (active) setLoading(false); });
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [source, key, version, retry]);
  function change(patch: Partial<AlertFilters>) { setFilters(old => ({ ...old, ...patch, offset: 0 })); }
  async function mark(alert?: Alert) {
    setBusy(true); setError('');
    try { if (alert) await read(alert); else await readAll(); setRetry(v => v + 1); }
    catch { setError('No pudimos guardar la lectura. Vuelve a intentarlo.'); }
    finally { setBusy(false); }
  }
  return <section className="alerts-page" aria-labelledby="alerts-title">
    <header className="alerts-page-heading"><h1 id="alerts-title"><Bell size={16} aria-hidden="true" />Centro de alertas</h1>
      <div className="alerts-page-actions"><button type="button" disabled={loading} onClick={() => { setRetry(v => v + 1); void refresh(); }}><RefreshCw size={15} />Actualizar</button>
        <button type="button" disabled={busy || !preview?.unreadCount} onClick={() => void mark()}><CheckCheck size={15} />Marcar activas leídas</button></div>
    </header>
    <div className="alerts-page-panel">
    <div className="alerts-filters">
      <label>Estado<select value={filters.estado} onChange={e => change({ estado: e.target.value as AlertFilters['estado'] })}><option value="ACTIVA">Activas</option><option value="RESUELTA">Resueltas</option><option value="TODAS">Todas</option></select></label>
      <label>Tipo<select value={filters.tipo} onChange={e => change({ tipo: e.target.value as AlertFilters['tipo'] })}><option value="TODAS">Todos los tipos</option>{Object.entries(alertTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Prioridad<select value={filters.prioridad} onChange={e => change({ prioridad: e.target.value as AlertFilters['prioridad'] })}><option value="TODAS">Todas</option><option value="CRITICA">Crítica</option><option value="ALTA">Alta</option><option value="MEDIA">Media</option></select></label>
      <label className="alerts-unread-filter"><input type="checkbox" checked={filters.noLeidas} onChange={e => change({ noLeidas: e.target.checked })} />Solo sin leer</label>
    </div>
    {error && <div className="alerts-error" role="alert">{error}{current && ' Se conservan los últimos resultados cargados.'}<button type="button" onClick={() => setRetry(v => v + 1)}>Reintentar</button></div>}
    <p className="alerts-list-status" role="status">{loading ? 'Actualizando alertas…' : current ? `${current.total} resultados · ${current.unreadCount} alertas activas sin leer · Hora de Lima` : 'Sin datos actualizados'}</p>
    <div className="alerts-page-list" aria-busy={loading}>
      {current?.items.map(alert => <AlertItem key={alert.id} alert={alert} busy={busy} onRead={a => void mark(a)} />)}
      {!current && !error && <p className="alerts-empty">Cargando alertas…</p>}
      {current?.items.length === 0 && <p className="alerts-empty">No hay alertas que coincidan con los filtros y permisos de tu rol.</p>}
    </div>
    {current && <nav className="alerts-pagination" aria-label="Paginación de alertas"><span>{current.total ? filters.offset + 1 : 0}–{filters.offset + current.items.length} de {current.total}</span>
      <button type="button" disabled={loading || filters.offset === 0} onClick={() => setFilters(old => ({ ...old, offset: Math.max(0, old.offset - old.limit) }))}>Anterior</button>
      <button type="button" disabled={loading || filters.offset + filters.limit >= current.total} onClick={() => setFilters(old => ({ ...old, offset: old.offset + old.limit }))}>Siguiente</button>
    </nav>}
    </div>
  </section>;
}
