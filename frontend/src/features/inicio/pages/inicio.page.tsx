import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  AlertCircle,
  EyeOff,
  Menu,
  RefreshCw,
  Wallet,
  FileText,
  Receipt,
  Boxes,
  AlertTriangle,
  Clock
} from 'lucide-react';
import {
  FaFileInvoice,
  FaFileInvoiceDollar
} from 'react-icons/fa6';
import type { User } from '../../auth/api/auth';
import { InicioCharts } from '../presentation/components/inicio-charts';
import { loadInicioCharts } from '../infrastructure/inicio-charts-api';
import './inicio.css';

interface Summary {
  updatedAt: string;
  products: number;
  lowStock: number;
  expired: number;
  expiringCount: number;
  expiring: {
    id: string;
    producto: string;
    lote: string;
    vencimiento: string;
    unidades: number;
  }[];
  sales: { count: number; total: string } | null;
}

const money = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

export default function Page() {
  const user = useOutletContext<User>();
  const navigate = useNavigate();
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const onUnauthorized = useCallback(() => navigate('/login', { replace: true }), [navigate]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError('');
    const timer = setTimeout(() => controller.abort(), 15000);

    fetch('/api/inicio', { credentials: 'same-origin', cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) {
          navigate('/login', { replace: true });
          return;
        }
        if (!response.ok) throw new Error();
        const summary: Summary = await response.json();
        if (active) setData(summary);
      })
      .catch(() => {
        if (active) setError('No pudimos actualizar el resumen. Comprueba tu conexión y vuelve a intentarlo.');
      })
      .finally(() => {
        clearTimeout(timer);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [version, navigate]);

  const salesTotal = data?.sales ? Number(data.sales.total) : 0;
  const salesCount = data?.sales?.count ?? 0;
  const formattedSales = money.format(salesTotal).replace('PEN', 'S/').replace(/\s/g, ' ');

  return (
    <div className="dash">
      {/* Barra DASHBOARD + botones de emisión en la misma horizontal */}
      <div className="dash-bar">
        <h1 className="dash-title">
          <Menu size={14} /> Dashboard
        </h1>
        <div className="dash-actions">
          <Link to="/ventas?tipo=FACTURA" className="dash-btn"><FaFileInvoice size={12} /> Emitir factura</Link>
          <Link to="/ventas?tipo=BOLETA" className="dash-btn"><FaFileInvoiceDollar size={12} /> Emitir boleta</Link>
        </div>
      </div>

      <section className="dash-panel">
        <div className="dash-panel-top">
          <button className="eye-btn" title="Ocultar montos"><EyeOff size={13} /></button>
          <button className="period-btn" title="Actualizar" disabled={loading} onClick={() => setVersion((v) => v + 1)}>
            <RefreshCw size={12} />
            {loading ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>

        {error && (
          <div className="dash-error" role="alert">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <div className="kpi-grid">
          <div className="kpi-card card-blue">
            <div className="kpi-icon-box icon-box-blue"><Wallet size={22} strokeWidth={2.2} /></div>
            <div className="kpi-info">
              <span className="kpi-title">Ventas netas</span>
              <span className="kpi-value">{formattedSales}</span>
              <span className="kpi-subtext">{salesCount} operaciones</span>
            </div>
          </div>

          <div className="kpi-card card-slate">
            <div className="kpi-icon-box icon-box-slate"><FileText size={22} strokeWidth={2.2} /></div>
            <div className="kpi-info">
              <span className="kpi-title">Facturas</span>
              <span className="kpi-value">S/ 0.00</span>
              <span className="kpi-subtext">0 comprobantes</span>
            </div>
          </div>

          <div className="kpi-card card-amber">
            <div className="kpi-icon-box icon-box-amber"><Receipt size={22} strokeWidth={2.2} /></div>
            <div className="kpi-info">
              <span className="kpi-title">Boletas</span>
              <span className="kpi-value">{formattedSales}</span>
              <span className="kpi-subtext">{salesCount} comprobantes</span>
            </div>
          </div>

          <div className="kpi-card card-emerald">
            <div className="kpi-icon-box icon-box-emerald"><Boxes size={22} strokeWidth={2.2} /></div>
            <div className="kpi-info">
              <span className="kpi-title">Productos activos</span>
              <span className="kpi-value">{data?.products ?? '—'}</span>
              <span className="kpi-subtext">En catálogo</span>
            </div>
          </div>

          <div className="kpi-card card-orange">
            <div className="kpi-icon-box icon-box-orange"><AlertTriangle size={22} strokeWidth={2.2} /></div>
            <div className="kpi-info">
              <span className="kpi-title">Stock por reponer</span>
              <span className="kpi-value">{data?.lowStock ?? '—'}</span>
              <span className="kpi-subtext">Bajo el stock mínimo</span>
            </div>
          </div>

          <div className="kpi-card card-rose">
            <div className="kpi-icon-box icon-box-rose"><Clock size={22} strokeWidth={2.2} /></div>
            <div className="kpi-info">
              <span className="kpi-title">Próximos a vencer</span>
              <span className="kpi-value">{data?.expiringCount ?? '—'}</span>
              <span className="kpi-subtext">Próximos 30 días</span>
            </div>
          </div>
        </div>

        <InicioCharts load={loadInicioCharts} version={version} onUnauthorized={onUnauthorized} canViewSales={user.rol !== 'ALMACENERO'} />

        {data && (data.expiring.length > 0 || data.lowStock > 0) && (
          <div className="dash-box" style={{ marginTop: 14 }}>
            <h2 className="dash-box-title alerts-title"><AlertTriangle size={13} /> Atención al inventario</h2>
            <div className="expiring-list">
              {data.expiring.slice(0, 5).map((lot) => (
                <div key={lot.id} className="expiring-item">
                  <div>
                    <div className="expiring-title">{lot.producto}</div>
                    <div className="expiring-meta">Lote {lot.lote} · {lot.unidades} unidades</div>
                  </div>
                  <div className="expiring-date">
                    Vence {new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(lot.vencimiento + 'T12:00:00Z'))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
