import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  EyeOff,
  Menu,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react';
import {
  FaWallet,
  FaFileLines,
  FaFileInvoice,
  FaFileInvoiceDollar,
  FaBoxOpen,
  FaTriangleExclamation,
  FaClock
} from 'react-icons/fa6';
import type { User } from '../../auth/api/auth';
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

  // Escala del gráfico: S/ 0 a S/ max (como la referencia, con rejilla horizontal)
  const maxY = salesTotal > 0 ? Math.ceil(salesTotal) : 1;
  const ticks = [1, 0.8, 0.6, 0.4, 0.2, 0].map((t) => ({
    y: 14 + (1 - t) * 180,
    label: 'S/ ' + Number((maxY * t).toFixed(2)),
  }));
  const barH = salesTotal > 0 ? (salesTotal / maxY) * 180 : 0;

  return (
    <div className="dash">
      {/* Barra DASHBOARD + botones de emisión en la misma horizontal */}
      <div className="dash-bar">
        <h1 className="dash-title">
          <Menu size={14} /> Dashboard
        </h1>
        <div className="dash-actions">
          <Link to="/ventas" className="dash-btn"><FaFileInvoice size={12} /> Emitir factura</Link>
          <Link to="/ventas" className="dash-btn"><FaFileInvoiceDollar size={12} /> Emitir boleta</Link>
          <Link to="/ventas" className="dash-btn"><FaFileLines size={12} /> Nota de venta</Link>
        </div>
      </div>

      <section className="dash-panel">
        <div className="dash-panel-top">
          <button className="eye-btn" title="Ocultar montos"><EyeOff size={13} /></button>
          <button className="period-btn" title="Actualizar" disabled={loading} onClick={() => setVersion((v) => v + 1)}>
            {loading ? <RefreshCw size={12} /> : <Calendar size={12} />}
            Este mes
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
            <div className="kpi-icon-box icon-box-blue"><FaWallet size={22} /></div>
            <div className="kpi-info">
              <span className="kpi-title">Ventas netas</span>
              <span className="kpi-value">{formattedSales}</span>
              <span className="kpi-subtext">{salesCount} operaciones</span>
            </div>
          </div>

          <div className="kpi-card card-slate">
            <div className="kpi-icon-box icon-box-slate"><FaFileInvoice size={22} /></div>
            <div className="kpi-info">
              <span className="kpi-title">Facturas</span>
              <span className="kpi-value">S/ 0.00</span>
              <span className="kpi-subtext">0 comprobantes</span>
            </div>
          </div>

          <div className="kpi-card card-amber">
            <div className="kpi-icon-box icon-box-amber"><FaFileInvoiceDollar size={22} /></div>
            <div className="kpi-info">
              <span className="kpi-title">Boletas</span>
              <span className="kpi-value">{formattedSales}</span>
              <span className="kpi-subtext">{salesCount} comprobantes</span>
            </div>
          </div>

          <div className="kpi-card card-dark">
            <div className="kpi-icon-box icon-box-dark"><FaFileLines size={22} /></div>
            <div className="kpi-info">
              <span className="kpi-title">Notas de venta</span>
              <span className="kpi-value">S/ 0.00</span>
              <span className="kpi-subtext">0 comprobantes</span>
            </div>
          </div>

          <div className="kpi-card card-emerald">
            <div className="kpi-icon-box icon-box-emerald"><FaBoxOpen size={22} /></div>
            <div className="kpi-info">
              <span className="kpi-title">Productos activos</span>
              <span className="kpi-value">{data?.products ?? 0}</span>
              <span className="kpi-subtext">En catálogo</span>
            </div>
          </div>

          <div className="kpi-card card-orange">
            <div className="kpi-icon-box icon-box-orange"><FaTriangleExclamation size={22} /></div>
            <div className="kpi-info">
              <span className="kpi-title">Stock por reponer</span>
              <span className="kpi-value">{data?.lowStock ?? 0}</span>
              <span className="kpi-subtext">Bajo el stock mínimo</span>
            </div>
          </div>

          <div className="kpi-card card-rose">
            <div className="kpi-icon-box icon-box-rose"><FaClock size={22} /></div>
            <div className="kpi-info">
              <span className="kpi-title">Próximos a vencer</span>
              <span className="kpi-value">{data?.expiringCount ?? 0}</span>
              <span className="kpi-subtext">Próximos 30 días</span>
            </div>
          </div>
        </div>

        <div className="dash-bottom">
          <div className="dash-box">
            <h2 className="dash-box-title"><BarChart3 size={13} /> Evolución de ventas</h2>
            <svg className="chart-svg" viewBox="0 0 640 230" preserveAspectRatio="none" role="img" aria-label="Evolución de ventas">
              {ticks.map((t) => (
                <g key={t.label + t.y}>
                  <text x="0" y={t.y + 4} className="chart-text" fontSize="11">{t.label}</text>
                  <line x1="50" x2="636" y1={t.y} y2={t.y} className="chart-grid-line" strokeWidth="1.2" />
                </g>
              ))}
              {salesTotal > 0 && (
                <rect x="320" y={194 - barH} width="40" height={barH} rx="3" fill="#6a46f2" />
              )}
              <text x="340" y="216" className="chart-text" fontSize="11" textAnchor="middle">Hoy</text>
            </svg>
          </div>

          <div className="dash-box">
            <h2 className="dash-box-title"><PieChart size={13} /> Top 5 productos más vendidos</h2>
            <p className="top-empty">Aún no hay ventas registradas para mostrar el ranking.</p>
          </div>
        </div>

        {data && (data.expiring.length > 0 || data.lowStock > 0) && (
          <div className="dash-box" style={{ marginTop: 14 }}>
            <h2 className="dash-box-title alerts-title"><FaTriangleExclamation size={13} /> Atención al inventario</h2>
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
