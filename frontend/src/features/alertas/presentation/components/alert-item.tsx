import { Link } from 'react-router-dom';
import { AlertTriangle, PackageX, CalendarClock, Check } from 'lucide-react';
import { alertDescription, alertTarget, alertTypeLabels, type Alert } from '../../domain/alert';

const dateTime = (date: string) => new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' }).format(new Date(date));
export function AlertItem({ alert, onRead, busy }: { alert: Alert; onRead(alert: Alert): void; busy: boolean }) {
  const Icon = alert.tipo === 'AGOTADO' ? PackageX : alert.loteId ? CalendarClock : AlertTriangle;
  return <article className={`alert-item ${!alert.leida ? 'is-unread' : ''}`} aria-label={`${alertTypeLabels[alert.tipo]}: ${alert.datos.producto}`}>
    <Icon className={`alert-item-icon priority-${alert.prioridad.toLowerCase()}`} size={20} aria-hidden="true" />
    <div className="alert-item-content">
      <div className="alert-item-heading"><strong>{alertTypeLabels[alert.tipo]}</strong><span className={`alert-priority priority-${alert.prioridad.toLowerCase()}`}>{alert.prioridad === 'CRITICA' ? 'Crítica' : alert.prioridad === 'ALTA' ? 'Alta' : 'Media'}</span></div>
      <p className="alert-product-name">{alert.datos.producto}</p>
      <p className="alert-description">{alertDescription(alert)}</p>
      <div className="alert-item-meta"><time dateTime={alert.actualizadaEn}>{dateTime(alert.actualizadaEn)}</time>
        {alert.estado === 'RESUELTA' && <span className="alert-resolved">Resuelta</span>}
        {!alert.leida && <span>Sin leer</span>}
      </div>
      <div className="alert-item-actions">
        <Link to={alertTarget(alert)}>Ver producto</Link>
        {!alert.leida ? <button type="button" disabled={busy} onClick={() => onRead(alert)}><Check size={13} />Marcar leída</button> : <span className="alert-read-label">Leída</span>}
      </div>
    </div>
  </article>;
}
