import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, RefreshCw, X, CheckCheck } from 'lucide-react';
import { useAlerts } from '../alerts-context';
import type { Alert } from '../../domain/alert';
import { AlertItem } from './alert-item';
import '../alerts.css';

export function AlertBell() {
  const { preview, loading, error, refresh, read, readAll } = useAlerts();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mutationError, setMutationError] = useState('');
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  useEffect(() => { setOpen(false); }, [location.key]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!wrapper.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  async function mark(alert?: Alert) {
    setBusy(true); setMutationError('');
    try { if (alert) await read(alert); else await readAll(); }
    catch { setMutationError('No pudimos guardar la lectura. Vuelve a intentarlo.'); }
    finally { setBusy(false); }
  }
  const count = preview?.unreadCount;
  return <div className="alerts-bell" ref={wrapper}>
    <button type="button" ref={trigger} className="icon-btn" aria-label={error ? 'Alertas: no se pudo actualizar' : count === undefined ? 'Cargando alertas' : `Alertas: ${count} activas sin leer`} title="Centro de alertas" aria-expanded={open} aria-controls="alerts-popover" onClick={() => { setOpen(v => !v); if (!open) void refresh(); }}>
      <Bell size={17} />
      {(error || count === undefined || count > 0) && <span className="notification-badge">{error ? '!' : count === undefined ? '…' : count > 99 ? '99+' : count}</span>}
    </button>
    {open && <section id="alerts-popover" className="alerts-popover" aria-label="Centro de alertas">
      <div className="alerts-popover-heading"><h2>Alertas</h2><div>
        <button type="button" aria-label="Actualizar alertas" disabled={loading} onClick={() => void refresh()}><RefreshCw size={16} /></button>
        <button type="button" aria-label="Cerrar alertas" onClick={() => { setOpen(false); trigger.current?.focus(); }}><X size={18} /></button>
      </div></div>
      <p className="alerts-popover-subtitle">{preview ? `${preview.unreadCount} activas sin leer · Hora de Lima` : 'Consultando alertas…'}</p>
      {(error || mutationError) && <p role="alert" className="alerts-error">{mutationError || error}</p>}
      <div className="alerts-popover-list" aria-busy={loading}>
        {preview?.items.map(alert => <AlertItem key={alert.id} alert={alert} busy={busy} onRead={a => void mark(a)} />)}
        {preview?.items.length === 0 && <p className="alerts-empty">No tienes alertas activas sin leer para tu rol.</p>}
        {!preview && <p className="alerts-empty">{loading ? 'Cargando alertas…' : 'No pudimos cargar las alertas. Usa Actualizar para reintentar.'}</p>}
      </div>
      <div className="alerts-popover-footer"><Link to="/alertas">Ver todas las alertas</Link><button type="button" disabled={busy || !count} onClick={() => void mark()}><CheckCheck size={14} />Marcar activas leídas</button></div>
    </section>}
  </div>;
}
