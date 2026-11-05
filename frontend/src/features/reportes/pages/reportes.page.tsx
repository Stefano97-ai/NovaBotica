import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Package,
  Truck,
  AlertTriangle,
  Calendar,
  Search,
  FileSpreadsheet,
  FileText,
  Printer,
  Receipt,
  CheckCircle2,
  Filter,
  DollarSign,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  Layers,
  ShoppingBag
} from 'lucide-react';
import './reportes.css';

/* ================= TIPOS DE DATOS ================= */
type TabReporte = 'ventas' | 'inventario' | 'compras' | 'vencimientos';

interface VentaReporte {
  id: number;
  comprobante: string;
  tipo: 'FACTURA' | 'BOLETA';
  fecha: string;
  cliente: string;
  items: number;
  metodoPago: 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TARJETA';
  total: number;
  utilidad: number;
}

interface ProductoRotacion {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  unidadesVendidas: number;
  ingresosTotales: number;
  stockActual: number;
  rotacion: 'ALTA' | 'MEDIA' | 'BAJA';
}

interface CompraReporte {
  id: number;
  factura: string;
  proveedor: string;
  ruc: string;
  fecha: string;
  items: number;
  monto: number;
  condicion: 'CONTADO' | 'CRÉDITO 30D';
}

interface LoteVencimiento {
  id: number;
  codigo: string;
  producto: string;
  lote: string;
  vencimiento: string;
  diasRestantes: number;
  unidades: number;
  estado: 'VENCIDO' | 'CRÍTICO' | 'PREVENTIVO' | 'ÓPTIMO';
}

/* ================= DATOS DE DEMOSTRACIÓN ROBUSTOS ================= */
const VENTAS_DATA: VentaReporte[] = [
  { id: 1, comprobante: 'F001-0065', tipo: 'FACTURA', fecha: '05/11/2026 11:57', cliente: 'CLÍNICA SAN PABLO S.A.C.', items: 4, metodoPago: 'TARJETA', total: 420.50, utilidad: 135.20 },
  { id: 2, comprobante: 'B001-0094', tipo: 'BOLETA', fecha: '05/11/2026 10:45', cliente: 'JUAN CARLOS MENDOZA', items: 2, metodoPago: 'YAPE', total: 58.00, utilidad: 19.50 },
  { id: 3, comprobante: 'B001-0093', tipo: 'BOLETA', fecha: '04/11/2026 19:07', cliente: 'MARÍA ELENA QUISPE', items: 6, metodoPago: 'EFECTIVO', total: 84.00, utilidad: 31.00 },
  { id: 4, comprobante: 'F001-0064', tipo: 'FACTURA', fecha: '04/11/2026 18:30', cliente: 'SERVICIOS MÉDICOS DEL SUR', items: 12, metodoPago: 'TARJETA', total: 1250.00, utilidad: 410.00 },
  { id: 5, comprobante: 'B001-0092', tipo: 'BOLETA', fecha: '04/11/2026 17:15', cliente: 'CLIENTE VARIOS', items: 1, metodoPago: 'PLIN', total: 26.00, utilidad: 8.50 },
  { id: 6, comprobante: 'B001-0091', tipo: 'BOLETA', fecha: '03/11/2026 16:40', cliente: 'ROSA ALICIA TORRES', items: 3, metodoPago: 'EFECTIVO', total: 45.50, utilidad: 16.20 },
  { id: 7, comprobante: 'F001-0063', tipo: 'FACTURA', fecha: '03/11/2026 14:10', cliente: 'FARMA SALUD PERÚ S.A.', items: 8, metodoPago: 'TARJETA', total: 890.00, utilidad: 295.00 },
  { id: 8, comprobante: 'B001-0090', tipo: 'BOLETA', fecha: '03/11/2026 12:20', cliente: 'PEDRO PABLO VALDEZ', items: 2, metodoPago: 'YAPE', total: 38.00, utilidad: 14.00 },
  { id: 9, comprobante: 'B001-0089', tipo: 'BOLETA', fecha: '02/11/2026 19:00', cliente: 'LUZ MARINA PAREDES', items: 5, metodoPago: 'EFECTIVO', total: 112.00, utilidad: 39.00 },
  { id: 10, comprobante: 'F001-0062', tipo: 'FACTURA', fecha: '02/11/2026 18:58', cliente: 'LABORATORIOS UNIDOS S.A.', items: 15, metodoPago: 'TARJETA', total: 2450.00, utilidad: 780.00 },
];

const ROTACION_DATA: ProductoRotacion[] = [
  { id: 1, codigo: 'MED-001', nombre: 'Paracetamol 500mg Tabletas - Genfar', categoria: 'Analgésicos', unidadesVendidas: 420, ingresosTotales: 336.00, stockActual: 95, rotacion: 'ALTA' },
  { id: 2, codigo: 'MED-006', nombre: 'Panadol Antigripal Tableta x 24 - GSK', categoria: 'Analgésicos', unidadesVendidas: 185, ingresosTotales: 4810.00, stockActual: 30, rotacion: 'ALTA' },
  { id: 3, codigo: 'MED-003', nombre: 'Ibuprofeno 400mg Tabletas - Farmaindustria', categoria: 'Analgésicos', unidadesVendidas: 160, ingresosTotales: 160.00, stockActual: 48, rotacion: 'ALTA' },
  { id: 4, codigo: 'MED-002', nombre: 'Amoxicilina 500mg Cápsulas - Medifarma', categoria: 'Antibióticos', unidadesVendidas: 145, ingresosTotales: 217.50, stockActual: 19, rotacion: 'MEDIA' },
  { id: 5, codigo: 'MED-005', nombre: 'Alcohol Medicinal 70° 1 Litro - Alkofarma', categoria: 'Antisépticos', unidadesVendidas: 110, ingresosTotales: 1320.00, stockActual: 45, rotacion: 'MEDIA' },
  { id: 6, codigo: 'MED-004', nombre: 'Azitromicina 500mg Caja x 3 - Lab Portugal', categoria: 'Antibióticos', unidadesVendidas: 90, ingresosTotales: 1620.00, stockActual: 24, rotacion: 'MEDIA' },
  { id: 7, codigo: 'MED-007', nombre: 'Suero Fisiológico 0.9% 500ml - Braun', categoria: 'Material Médico', unidadesVendidas: 65, ingresosTotales: 487.50, stockActual: 82, rotacion: 'BAJA' },
  { id: 8, codigo: 'MED-008', nombre: 'Bismutol Suspensión 150ml - Bagó', categoria: 'Gastrointestinal', unidadesVendidas: 40, ingresosTotales: 900.00, stockActual: 16, rotacion: 'BAJA' },
];

const COMPRAS_DATA: CompraReporte[] = [
  { id: 1, factura: 'F102-45210', proveedor: 'DROGUERÍA LOS ANDES S.A.C.', ruc: '20100458921', fecha: '04/11/2026', items: 18, monto: 5420.00, condicion: 'CRÉDITO 30D' },
  { id: 2, factura: 'F005-12840', proveedor: 'MEDIFARMA S.A.', ruc: '20258741369', fecha: '02/11/2026', items: 25, monto: 8150.00, condicion: 'CONTADO' },
  { id: 3, factura: 'F001-98741', proveedor: 'LABORATORIOS PORTUGAL S.R.L.', ruc: '20458796321', fecha: '28/10/2026', items: 10, monto: 2980.50, condicion: 'CRÉDITO 30D' },
  { id: 4, factura: 'F014-66321', proveedor: 'FARMAINDUSTRIA S.A.', ruc: '20145896325', fecha: '24/10/2026', items: 14, monto: 4200.00, condicion: 'CONTADO' },
  { id: 5, factura: 'F002-33215', proveedor: 'ALKOFARMA E.I.R.L.', ruc: '20369852147', fecha: '18/10/2026', items: 8, monto: 1860.00, condicion: 'CONTADO' },
];

const LOTES_DATA: LoteVencimiento[] = [
  { id: 1, codigo: 'MED-002', producto: 'Amoxicilina 500mg Cápsulas - Medifarma', lote: 'L-AMX24-03', vencimiento: '18/11/2026', diasRestantes: 13, unidades: 19, estado: 'CRÍTICO' },
  { id: 2, codigo: 'MED-008', producto: 'Bismutol Suspensión 150ml - Bagó', lote: 'L-BIS24-09', vencimiento: '02/12/2026', diasRestantes: 27, unidades: 16, estado: 'CRÍTICO' },
  { id: 3, codigo: 'MED-004', producto: 'Azitromicina 500mg Caja x 3 - Lab Portugal', lote: 'L-AZI24-05', vencimiento: '15/01/2027', diasRestantes: 71, unidades: 24, estado: 'PREVENTIVO' },
  { id: 4, codigo: 'MED-006', producto: 'Panadol Antigripal Tableta x 24 - GSK', lote: 'L-PAN24-11', vencimiento: '28/01/2027', diasRestantes: 84, unidades: 30, estado: 'PREVENTIVO' },
  { id: 5, codigo: 'MED-001', producto: 'Paracetamol 500mg Tabletas - Genfar', lote: 'L-PAR24-01', vencimiento: '15/08/2027', diasRestantes: 283, unidades: 95, estado: 'ÓPTIMO' },
  { id: 6, codigo: 'MED-005', producto: 'Alcohol Medicinal 70° 1 Litro - Alkofarma', lote: 'L-ALC24-07', vencimiento: '20/10/2027', diasRestantes: 349, unidades: 45, estado: 'ÓPTIMO' },
];

export default function ReportesPage() {
  const [activeTab, setActiveTab] = useState<TabReporte>('ventas');
  const [fechaInicio, setFechaInicio] = useState('2026-11-01');
  const [fechaFin, setFechaFin] = useState('2026-11-05');
  const [sedeFiltro, setSedeFiltro] = useState('TECHMULTISER PRINCIPAL');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [notif, setNotif] = useState<string | null>(null);

  function triggerNotif(msg: string) {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3500);
  }

  function handleExportar(tipo: 'PDF' | 'EXCEL' | 'IMPRIMIR') {
    if (tipo === 'PDF') {
      triggerNotif(`Reporte de ${activeTab.toUpperCase()} exportado a PDF correctamente.`);
    } else if (tipo === 'EXCEL') {
      triggerNotif(`Descargando libro Excel de ${activeTab.toUpperCase()} (.xlsx)...`);
    } else {
      triggerNotif(`Preparando vista de impresión para ${activeTab.toUpperCase()}...`);
      window.print();
    }
  }

  function setRangoRapido(tipo: 'HOY' | 'SEMANA' | 'MES' | 'ANIO') {
    if (tipo === 'HOY') {
      setFechaInicio('2026-11-05');
      setFechaFin('2026-11-05');
    } else if (tipo === 'SEMANA') {
      setFechaInicio('2026-10-29');
      setFechaFin('2026-11-05');
    } else if (tipo === 'MES') {
      setFechaInicio('2026-11-01');
      setFechaFin('2026-11-05');
    } else {
      setFechaInicio('2026-01-01');
      setFechaFin('2026-11-05');
    }
    setPaginaActual(1);
    triggerNotif(`Rango actualizado: ${tipo}`);
  }

  /* ================= FILTRADO DINÁMICO SEGÚN PESTAÑA ================= */
  const ventasFiltradas = useMemo(() => {
    return VENTAS_DATA.filter((v) => {
      const matchTipo = filtroTipo === 'TODOS' || v.tipo === filtroTipo;
      const matchText =
        v.comprobante.toLowerCase().includes(busqueda.toLowerCase()) ||
        v.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
        v.metodoPago.toLowerCase().includes(busqueda.toLowerCase());
      return matchTipo && matchText;
    });
  }, [filtroTipo, busqueda]);

  const rotacionFiltrada = useMemo(() => {
    return ROTACION_DATA.filter((r) => {
      const matchTipo = filtroTipo === 'TODOS' || r.rotacion === filtroTipo;
      const matchText =
        r.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.categoria.toLowerCase().includes(busqueda.toLowerCase());
      return matchTipo && matchText;
    });
  }, [filtroTipo, busqueda]);

  const comprasFiltradas = useMemo(() => {
    return COMPRAS_DATA.filter((c) => {
      const matchTipo = filtroTipo === 'TODOS' || c.condicion.includes(filtroTipo);
      const matchText =
        c.proveedor.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.factura.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.ruc.includes(busqueda);
      return matchTipo && matchText;
    });
  }, [filtroTipo, busqueda]);

  const lotesFiltrados = useMemo(() => {
    return LOTES_DATA.filter((l) => {
      const matchTipo = filtroTipo === 'TODOS' || l.estado === filtroTipo;
      const matchText =
        l.producto.toLowerCase().includes(busqueda.toLowerCase()) ||
        l.lote.toLowerCase().includes(busqueda.toLowerCase()) ||
        l.codigo.toLowerCase().includes(busqueda.toLowerCase());
      return matchTipo && matchText;
    });
  }, [filtroTipo, busqueda]);

  return (
    <div className="rep-page">
      {/* ================= 1. SUBHEADER BAR (FONDO BLANCO) ================= */}
      <div className="rep-bar">
        <h1 className="rep-bar-title">
          <BarChart3 size={15} strokeWidth={2.2} /> REPORTES Y ESTADÍSTICAS
        </h1>
        <div className="rep-actions">
          <Link to="/ventas?tipo=FACTURA" className="rep-dash-btn" title="Emitir Factura Electrónica">
            <FileText size={12} strokeWidth={2} /> EMITIR FACTURA
          </Link>
          <Link to="/ventas?tipo=BOLETA" className="rep-dash-btn" title="Emitir Boleta de Venta">
            <Receipt size={12} strokeWidth={2} /> EMITIR BOLETA
          </Link>
        </div>
      </div>

      {/* ================= NOTIFICACIÓN FLASH ================= */}
      {notif && (
        <div
          style={{
            background: '#dcfce7',
            color: '#15803d',
            border: '1px solid #86efac',
            borderRadius: 8,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 700,
            fontSize: 12.5
          }}
        >
          <CheckCircle2 size={16} />
          <span>{notif}</span>
        </div>
      )}

      {/* ================= 2. PESTAÑAS DE REPORTES ================= */}
      <div className="rep-tabs-bar">
        <button
          type="button"
          className={`rep-tab-btn ${activeTab === 'ventas' ? 'is-active' : ''}`}
          onClick={() => { setActiveTab('ventas'); setFiltroTipo('TODOS'); setBusqueda(''); setPaginaActual(1); }}
        >
          <TrendingUp size={15} /> Ventas y Facturación
        </button>
        <button
          type="button"
          className={`rep-tab-btn ${activeTab === 'inventario' ? 'is-active' : ''}`}
          onClick={() => { setActiveTab('inventario'); setFiltroTipo('TODOS'); setBusqueda(''); setPaginaActual(1); }}
        >
          <Package size={15} /> Inventario y Rotación ABC
        </button>
        <button
          type="button"
          className={`rep-tab-btn ${activeTab === 'compras' ? 'is-active' : ''}`}
          onClick={() => { setActiveTab('compras'); setFiltroTipo('TODOS'); setBusqueda(''); setPaginaActual(1); }}
        >
          <Truck size={15} /> Compras y Proveedores
        </button>
        <button
          type="button"
          className={`rep-tab-btn ${activeTab === 'vencimientos' ? 'is-active' : ''}`}
          onClick={() => { setActiveTab('vencimientos'); setFiltroTipo('TODOS'); setBusqueda(''); setPaginaActual(1); }}
        >
          <AlertTriangle size={15} /> Lotes y Vencimientos
        </button>
      </div>

      {/* ================= 3. TARJETA PRINCIPAL ================= */}
      <div className="rep-card">
        {/* Cabecera de la tarjeta con rangos rápidos */}
        <div className="rep-card-header">
          <h2 className="rep-card-title">
            {activeTab === 'ventas' && 'REPORTE GENERAL DE VENTAS Y FACTURACIÓN'}
            {activeTab === 'inventario' && 'VALORIZACIÓN DE STOCK Y ROTACIÓN DE PRODUCTOS'}
            {activeTab === 'compras' && 'HISTORIAL DE COMPRAS Y ABASTECIMIENTO A LABORATORIOS'}
            {activeTab === 'vencimientos' && 'CONTROL DE VENCIMIENTOS Y TRAZABILIDAD DE LOTES'}
          </h2>
          <div className="rep-quick-dates">
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginRight: 4 }}>Periodo:</span>
            <button type="button" className="rep-quick-btn" onClick={() => setRangoRapido('HOY')}>Hoy</button>
            <button type="button" className="rep-quick-btn" onClick={() => setRangoRapido('SEMANA')}>Semana</button>
            <button type="button" className="rep-quick-btn active" onClick={() => setRangoRapido('MES')}>Este Mes</button>
            <button type="button" className="rep-quick-btn" onClick={() => setRangoRapido('ANIO')}>Año 2026</button>
          </div>
        </div>

        {/* ================= 4. KPIS CON BOTONES REALISTAS 3D ================= */}
        <div className="rep-kpi-ribbon">
          {activeTab === 'ventas' && (
            <>
              <div className="rep-kpi-card">
                <div className="rep-kpi-icon ventas">
                  <DollarSign size={22} strokeWidth={2.2} />
                </div>
                <div className="rep-kpi-info">
                  <span className="rep-kpi-val">S/ 6,144.50</span>
                  <span className="rep-kpi-label">Total Facturado</span>
                  <span className="rep-kpi-sub">Periodo actual seleccionado</span>
                </div>
              </div>
              <div className="rep-kpi-card">
                <div className="rep-kpi-icon docs">
                  <Receipt size={22} strokeWidth={2.2} />
                </div>
                <div className="rep-kpi-info">
                  <span className="rep-kpi-val">{VENTAS_DATA.length}</span>
                  <span className="rep-kpi-label">Comprobantes</span>
                  <span className="rep-kpi-sub">4 Facturas · 6 Boletas</span>
                </div>
              </div>
              <div className="rep-kpi-card">
                <div className="rep-kpi-icon margen">
                  <TrendingUp size={22} strokeWidth={2.2} />
                </div>
                <div className="rep-kpi-info">
                  <span className="rep-kpi-val">S/ 1,748.40</span>
                  <span className="rep-kpi-label">Margen de Utilidad</span>
                  <span className="rep-kpi-sub">28.4% margen bruto promedio</span>
                </div>
              </div>
              <div className="rep-kpi-card">
                <div className="rep-kpi-icon stock">
                  <ShoppingBag size={22} strokeWidth={2.2} />
                </div>
                <div className="rep-kpi-info">
                  <span className="rep-kpi-val">S/ 614.45</span>
                  <span className="rep-kpi-label">Ticket Promedio</span>
                  <span className="rep-kpi-sub">Por operación realizada</span>
                </div>
              </div>
            </>
          )}

          {activeTab === 'inventario' && (
            <>
              <div className="rep-kpi-card">
                <div className="rep-kpi-icon docs">
                  <Layers size={22} strokeWidth={2.2} />
                </div>
                <div className="rep-kpi-info">
                  <span className="rep-kpi-val">S/ 24,850.00</span>
                  <span className="rep-kpi-label">Valorización Costo</span>
                  <span className="rep-kpi-sub">Costo de adquisición de stock</span>
                </div>
              </div>
              <div className="rep-kpi-card">
                <div className="rep-kpi-icon ventas">
                  <DollarSign size={22} strokeWidth={2.2} />
                </div>
                <div className="rep-kpi-info">
                  <span className="rep-kpi-val">S/ 39,420.00</span>
                  <span className="rep-kpi-label">Valor Proyectado Venta</span>
                  <span className="rep-kpi-sub">Ingreso potencial estimado</span>
                </div>
              </div>
              <div className="rep-kpi-card">
                <div className="rep-kpi-icon stock">
                  <Package size={22} strokeWidth={2.2} />
                </div>
                <div className="rep-kpi-info">
                  <span className="rep-kpi-val">{ROTACION_DATA.length}</span>
                  <span className="rep-kpi-label">Referencias Activas</span>
                  <span className="rep-kpi-sub">Productos en catálogo</span>
                </div>
              </div>
              <div className="rep-kpi-card">
                <div className="rep-kpi-icon margen">
                  <TrendingUp size={22} strokeWidth={2.2} />
                </div>
                <div className="rep-kpi-info">
                  <span className="rep-kpi-val">3</span>
                  <span className="rep-kpi-label">Alta Rotación (A)</span>
                  <span className="rep-kpi-sub">Lideran el 70% de demanda</span>
                </div>
              </div>
            </>
          )}

          {activeTab === 'compras' && (
            <>
              <div className="rep-kpi-card">
                <div className="rep-kpi-icon ventas">
                  <DollarSign size={22} strokeWidth={2.2} />
                </div>
                <div className="rep-kpi-info">
                  <span className="rep-kpi-val">S/ 22,610.50</span>
                  <span className="rep-kpi-label">Compras Totales</span>
                  <span className="rep-kpi-sub">Inversión en abastecimiento</span>
                </div>
              </div>
              <div className="rep-kpi-card">
                <div className="rep-kpi-icon docs">
                  <FileText size={22} strokeWidth={2.2} />
                </div>
                <div className="rep-kpi-info">
                  <span className="rep-kpi-val">{COMPRAS_DATA.length}</span>
                  <span className="rep-kpi-label">Facturas de Compra</span>
                  <span className="rep-kpi-sub">Documentos de ingreso</span>
                </div>
              </div>
              <div className="rep-kpi-card">
                <div className="rep-kpi-icon stock">
                  <Truck size={22} strokeWidth={2.2} />
                </div>
                <div className="rep-kpi-info">
                  <span className="rep-kpi-val">5</span>
                  <span className="rep-kpi-label">Proveedores</span>
                  <span className="rep-kpi-sub">Laboratorios y droguerías</span>
                </div>
              </div>
              <div className="rep-kpi-card">
                <div className="rep-kpi-icon margen">
                  <ArrowUpRight size={22} strokeWidth={2.2} />
                </div>
                <div className="rep-kpi-info">
                  <span className="rep-kpi-val">S/ 8,400.50</span>
                  <span className="rep-kpi-label">Por Pagar (Crédito)</span>
                  <span className="rep-kpi-sub">2 facturas pendientes</span>
                </div>
              </div>
            </>
          )}

          {activeTab === 'vencimientos' && (
            <>
              <div className="rep-kpi-card">
                <div className="rep-kpi-icon alerta">
                  <AlertTriangle size={22} strokeWidth={2.2} />
                </div>
                <div className="rep-kpi-info">
                  <span className="rep-kpi-val">2</span>
                  <span className="rep-kpi-label">Críticos (≤ 30 días)</span>
                  <span className="rep-kpi-sub">Acción de rotación urgente</span>
                </div>
              </div>
              <div className="rep-kpi-card">
                <div className="rep-kpi-icon margen">
                  <Clock size={22} strokeWidth={2.2} />
                </div>
                <div className="rep-kpi-info">
                  <span className="rep-kpi-val">2</span>
                  <span className="rep-kpi-label">Preventivos (31-90 d)</span>
                  <span className="rep-kpi-sub">Supervisión en mostrador</span>
                </div>
              </div>
              <div className="rep-kpi-card">
                <div className="rep-kpi-icon ventas">
                  <CheckCircle2 size={22} strokeWidth={2.2} />
                </div>
                <div className="rep-kpi-info">
                  <span className="rep-kpi-val">2</span>
                  <span className="rep-kpi-label">Óptimos (&gt; 90 días)</span>
                  <span className="rep-kpi-sub">Vida útil prolongada</span>
                </div>
              </div>
              <div className="rep-kpi-card">
                <div className="rep-kpi-icon docs">
                  <Package size={22} strokeWidth={2.2} />
                </div>
                <div className="rep-kpi-info">
                  <span className="rep-kpi-val">229</span>
                  <span className="rep-kpi-label">Unidades en Lotes</span>
                  <span className="rep-kpi-sub">Stock bajo seguimiento</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ================= 5. CAJA DE FILTROS ================= */}
        <div className="rep-filters-box">
          <div className="rep-filters-row">
            {/* Fechas */}
            <div className="rep-date-group" title="Fecha inicio">
              <Calendar size={14} color="#64748b" />
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                aria-label="Fecha Desde"
              />
            </div>
            <div className="rep-date-group" title="Fecha fin">
              <Calendar size={14} color="#64748b" />
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                aria-label="Fecha Hasta"
              />
            </div>

            {/* Sede */}
            <select
              className="rep-select"
              value={sedeFiltro}
              onChange={(e) => setSedeFiltro(e.target.value)}
              title="Filtrar por sede"
            >
              <option value="TECHMULTISER PRINCIPAL">TECHMULTISER PRINCIPAL - CAL. TACNA 5526</option>
              <option value="SUCURSAL 2">SUCURSAL 2 - SAN ISIDRO</option>
              <option value="TODAS">TODAS LAS SUCURSALES</option>
            </select>

            {/* Filtro específico por pestaña */}
            {activeTab === 'ventas' && (
              <select
                className="rep-select"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                title="Filtrar por tipo de comprobante"
              >
                <option value="TODOS">Todos los comprobantes</option>
                <option value="FACTURA">Solo Facturas</option>
                <option value="BOLETA">Solo Boletas</option>
              </select>
            )}

            {activeTab === 'inventario' && (
              <select
                className="rep-select"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                title="Filtrar por rotación"
              >
                <option value="TODOS">Todas las rotaciones</option>
                <option value="ALTA">Alta Rotación (A)</option>
                <option value="MEDIA">Media Rotación (B)</option>
                <option value="BAJA">Baja Rotación (C)</option>
              </select>
            )}

            {activeTab === 'compras' && (
              <select
                className="rep-select"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                title="Filtrar por condición de pago"
              >
                <option value="TODOS">Todas las condiciones</option>
                <option value="CONTADO">Contado</option>
                <option value="CRÉDITO">Crédito</option>
              </select>
            )}

            {activeTab === 'vencimientos' && (
              <select
                className="rep-select"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                title="Filtrar por estado de vencimiento"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="CRÍTICO">Críticos (≤ 30 días)</option>
                <option value="PREVENTIVO">Preventivos (31-90 días)</option>
                <option value="ÓPTIMO">Óptimos (&gt; 90 días)</option>
              </select>
            )}

            {/* Buscador en vivo */}
            <div className="rep-search-input">
              <input
                type="text"
                placeholder="Buscar por código, cliente, comprobante o producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <Search size={14} />
            </div>
          </div>
        </div>

        {/* ================= 6. BARRA FLOTANTE DE EXPORTACIÓN ================= */}
        <div className="rep-export-bar">
          <div className="rep-export-dock">
            <button
              type="button"
              className="rep-btn-dock rep-btn-pdf"
              title="Exportar Reporte a PDF"
              onClick={() => handleExportar('PDF')}
            >
              <FileText size={15} />
            </button>
            <button
              type="button"
              className="rep-btn-dock rep-btn-excel"
              title="Descargar en Excel (.xlsx)"
              onClick={() => handleExportar('EXCEL')}
            >
              <FileSpreadsheet size={15} />
            </button>
            <button
              type="button"
              className="rep-btn-dock rep-btn-cfg"
              title="Imprimir Reporte"
              onClick={() => handleExportar('IMPRIMIR')}
            >
              <Printer size={15} />
            </button>
          </div>
        </div>

        {/* ================= 7. GRÁFICAS DE RESUMEN ================= */}
        {activeTab === 'ventas' && (
          <div className="rep-charts-grid">
            <div className="rep-chart-card">
              <div className="rep-chart-head">
                <h3 className="rep-chart-title">
                  <BarChart3 size={15} color="#0284c7" /> Evolución de Ventas por Día (Semana Actual)
                </h3>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>+18.4% vs semana previa</span>
              </div>
              <div className="rep-bar-chart">
                <div className="rep-chart-col">
                  <div className="rep-chart-pill" style={{ height: '45%' }}>
                    <span className="rep-chart-val-bubble">S/ 580</span>
                  </div>
                  <span className="rep-chart-col-label">Lun</span>
                </div>
                <div className="rep-chart-col">
                  <div className="rep-chart-pill" style={{ height: '65%' }}>
                    <span className="rep-chart-val-bubble">S/ 920</span>
                  </div>
                  <span className="rep-chart-col-label">Mar</span>
                </div>
                <div className="rep-chart-col">
                  <div className="rep-chart-pill" style={{ height: '55%' }}>
                    <span className="rep-chart-val-bubble">S/ 740</span>
                  </div>
                  <span className="rep-chart-col-label">Mié</span>
                </div>
                <div className="rep-chart-col">
                  <div className="rep-chart-pill" style={{ height: '85%' }}>
                    <span className="rep-chart-val-bubble">S/ 1,320</span>
                  </div>
                  <span className="rep-chart-col-label">Jue</span>
                </div>
                <div className="rep-chart-col">
                  <div className="rep-chart-pill" style={{ height: '100%', background: 'linear-gradient(180deg, #34d399 0%, #059669 100%)' }}>
                    <span className="rep-chart-val-bubble" style={{ color: '#059669' }}>S/ 1,650</span>
                  </div>
                  <span className="rep-chart-col-label" style={{ color: '#059669' }}>Hoy</span>
                </div>
              </div>
            </div>

            <div className="rep-chart-card">
              <div className="rep-chart-head">
                <h3 className="rep-chart-title">
                  <DollarSign size={15} color="#10b981" /> Métodos de Pago
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
                <div className="rep-method-item">
                  <div className="rep-method-info">
                    <span>Efectivo</span>
                    <span>54% (S/ 3,318.00)</span>
                  </div>
                  <div className="rep-progress-track">
                    <div className="rep-progress-fill" style={{ width: '54%', background: '#10b981' }} />
                  </div>
                </div>
                <div className="rep-method-item">
                  <div className="rep-method-info">
                    <span>Yape / Plin</span>
                    <span>31% (S/ 1,904.80)</span>
                  </div>
                  <div className="rep-progress-track">
                    <div className="rep-progress-fill" style={{ width: '31%', background: '#8b5cf6' }} />
                  </div>
                </div>
                <div className="rep-method-item">
                  <div className="rep-method-info">
                    <span>Tarjeta Débito/Crédito</span>
                    <span>15% (S/ 921.70)</span>
                  </div>
                  <div className="rep-progress-track">
                    <div className="rep-progress-fill" style={{ width: '15%', background: '#0284c7' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= 8. TABLA DE DETALLES ================= */}
        <div className="rep-table-wrap">
          {activeTab === 'ventas' && (
            <table className="rep-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>COMPROBANTE</th>
                  <th>FECHA Y HORA</th>
                  <th>CLIENTE</th>
                  <th>ITEMS</th>
                  <th>MÉTODO DE PAGO</th>
                  <th>TOTAL</th>
                  <th>UTILIDAD EST.</th>
                  <th>ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {ventasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                      No se encontraron comprobantes con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  ventasFiltradas.map((v, index) => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 700, color: '#64748b' }}>{index + 1}</td>
                      <td style={{ fontWeight: 800, color: '#0f172a' }}>{v.comprobante}</td>
                      <td>{v.fecha}</td>
                      <td style={{ fontWeight: 600 }}>{v.cliente}</td>
                      <td>{v.items} unids.</td>
                      <td>
                        <span className={`rep-badge-pill ${v.metodoPago === 'EFECTIVO' ? 'rep-badge-success' : v.metodoPago === 'TARJETA' ? 'rep-badge-blue' : 'rep-badge-warning'}`}>
                          {v.metodoPago}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, color: '#0f172a' }}>S/ {v.total.toFixed(2)}</td>
                      <td style={{ fontWeight: 700, color: '#16a34a' }}>+S/ {v.utilidad.toFixed(2)}</td>
                      <td>
                        <span className="rep-badge-pill rep-badge-success">CONFIRMADO</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'inventario' && (
            <table className="rep-table">
              <thead>
                <tr>
                  <th>CÓDIGO</th>
                  <th>DESCRIPCIÓN DEL PRODUCTO</th>
                  <th>CATEGORÍA</th>
                  <th>UNIDADES VENDIDAS</th>
                  <th>INGRESOS GENERADOS</th>
                  <th>STOCK DISPONIBLE</th>
                  <th>ROTACIÓN ABC</th>
                </tr>
              </thead>
              <tbody>
                {rotacionFiltrada.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                      No se encontraron productos con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  rotacionFiltrada.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 700, color: '#475569' }}>{r.codigo}</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{r.nombre}</td>
                      <td>
                        <span className="rep-badge-pill rep-badge-blue">{r.categoria}</span>
                      </td>
                      <td style={{ fontWeight: 800 }}>{r.unidadesVendidas} unids.</td>
                      <td style={{ fontWeight: 800, color: '#16a34a' }}>S/ {r.ingresosTotales.toFixed(2)}</td>
                      <td style={{ fontWeight: 700 }}>{r.stockActual}</td>
                      <td>
                        <span className={`rep-badge-pill ${r.rotacion === 'ALTA' ? 'rep-badge-success' : r.rotacion === 'MEDIA' ? 'rep-badge-warning' : 'rep-badge-danger'}`}>
                          {r.rotacion} ROTACIÓN
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'compras' && (
            <table className="rep-table">
              <thead>
                <tr>
                  <th>N° FACTURA</th>
                  <th>PROVEEDOR / LABORATORIO</th>
                  <th>RUC</th>
                  <th>FECHA</th>
                  <th>ITEMS</th>
                  <th>MONTO TOTAL</th>
                  <th>CONDICIÓN</th>
                  <th>ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {comprasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                      No se encontraron registros de compra con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  comprasFiltradas.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 800, color: '#0f172a' }}>{c.factura}</td>
                      <td style={{ fontWeight: 700 }}>{c.proveedor}</td>
                      <td style={{ fontFamily: 'monospace' }}>{c.ruc}</td>
                      <td>{c.fecha}</td>
                      <td>{c.items} productos</td>
                      <td style={{ fontWeight: 800, color: '#0f172a' }}>S/ {c.monto.toFixed(2)}</td>
                      <td>
                        <span className={`rep-badge-pill ${c.condicion.includes('CONTADO') ? 'rep-badge-success' : 'rep-badge-warning'}`}>
                          {c.condicion}
                        </span>
                      </td>
                      <td>
                        <span className="rep-badge-pill rep-badge-success">REGISTRADO</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'vencimientos' && (
            <table className="rep-table">
              <thead>
                <tr>
                  <th>CÓDIGO</th>
                  <th>MEDICAMENTO / PRODUCTO</th>
                  <th>LOTE</th>
                  <th>FECHA VENCIMIENTO</th>
                  <th>DÍAS RESTANTES</th>
                  <th>UNIDADES</th>
                  <th>NIVEL DE RIESGO</th>
                </tr>
              </thead>
              <tbody>
                {lotesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>
                      No se encontraron lotes con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  lotesFiltrados.map((l) => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 700, color: '#475569' }}>{l.codigo}</td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>{l.producto}</td>
                      <td style={{ fontWeight: 700, color: '#4338ca' }}>{l.lote}</td>
                      <td style={{ fontWeight: 800 }}>{l.vencimiento}</td>
                      <td style={{ fontWeight: 800, color: l.diasRestantes <= 30 ? '#dc2626' : l.diasRestantes <= 90 ? '#d97706' : '#16a34a' }}>
                        {l.diasRestantes} días
                      </td>
                      <td style={{ fontWeight: 700 }}>{l.unidades}</td>
                      <td>
                        <span className={`rep-badge-pill ${l.estado === 'CRÍTICO' ? 'rep-badge-danger' : l.estado === 'PREVENTIVO' ? 'rep-badge-warning' : 'rep-badge-success'}`}>
                          {l.estado === 'CRÍTICO' ? '⚠️ CRÍTICO (≤ 30d)' : l.estado === 'PREVENTIVO' ? '🟡 PREVENTIVO' : '🟢 ÓPTIMO'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ================= 9. PAGINACIÓN ================= */}
        <div className="rep-pagination">
          <span>
            Mostrando {activeTab === 'ventas' ? ventasFiltradas.length : activeTab === 'inventario' ? rotacionFiltrada.length : activeTab === 'compras' ? comprasFiltradas.length : lotesFiltrados.length} registros encontrados
          </span>
          <div className="rep-page-numbers">
            <button type="button" className="rep-page-btn" disabled>&lt;</button>
            <button type="button" className="rep-page-btn active">1</button>
            <button type="button" className="rep-page-btn">2</button>
            <button type="button" className="rep-page-btn">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
}
