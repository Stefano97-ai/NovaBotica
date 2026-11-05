import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Boxes,
  ArrowLeftRight,
  Plus,
  Search,
  Calendar,
  FileSpreadsheet,
  FileText,
  Settings,
  X,
  CheckCircle2,
  AlertCircle,
  Receipt,
  ClipboardList,
  Pill,
  Filter,
  PenSquare,
  Power,
  Package,
  Layers,
  TrendingDown,
  Barcode,
  SlidersHorizontal,
  LayoutGrid
} from 'lucide-react';
import './inventario.css';
import { editProduct, changeProductStatus, type ProductRecord } from '../../productos/infrastructure/product-api';
import { KardexPage } from '../presentation/pages/kardex.page';
import { kardexSource } from '../infrastructure/kardex-api';

/* ================= TYPES ================= */
export interface MovimientoItem {
  id: number;
  productoId?: number;
  producto: string;
  movimiento: string;
  tipoMovimiento: 'VENTA' | 'COMPRA' | 'AJUSTE' | 'TRANSFERENCIA';
  fecha: string;
  cantidad: number;
  sede: string;
  lote: string;
  invInicial?: number;
  entrada?: number;
  salida?: number;
  invFinal?: number;
}

export interface ProductoItem {
  id: number;
  codigo: string;
  nombre: string;
  categoriaId: number;
  categoriaNombre: string;
  unidadBase: string;
  precioCompra: number;
  precioVenta: number;
  stockDisponible: number;
  stockMinimo: number;
  activo: boolean;
  requiereSerie?: boolean;
  imagenUrl?: string | null;
}

export interface CategoriaItem {
  id: number;
  nombre: string;
}

/* ================= INITIAL DEMO PRODUCTS ================= */
const INITIAL_MOVIMIENTOS: MovimientoItem[] = [
  {
    id: 1,
    productoId: 1,
    producto: 'Unidad de Estado Solido Kingston 240gb A400',
    movimiento: 'Venta F001-65',
    tipoMovimiento: 'VENTA',
    fecha: '03/11/2026 11:57:31',
    cantidad: 2,
    sede: 'TECHMULTISER PRINCIPAL - Sede: CAL. TACNA NRO 5526 URB. SAN MIGUEL LIMA - LIMA',
    lote: 'L-SSD24-01'
  },
  {
    id: 2,
    productoId: 2,
    producto: 'Laptop Lenovo i8 zz',
    movimiento: 'Venta F001-65',
    tipoMovimiento: 'VENTA',
    fecha: '03/11/2026 11:57:31',
    cantidad: 1,
    sede: 'TECHMULTISER PRINCIPAL - Sede: CAL. TACNA NRO 5526 URB. SAN MIGUEL LIMA - LIMA',
    lote: 'L-LEN24-02'
  },
  {
    id: 3,
    productoId: 3,
    producto: 'Computadora Dell Vostro Sff 3710 Core I7-12700 8gb Ddr4 compatible con nissan sentra 2020-2024',
    movimiento: 'Venta B001-94',
    tipoMovimiento: 'VENTA',
    fecha: '02/11/2026 23:09:31',
    cantidad: 2,
    sede: 'TECHMULTISER PRINCIPAL - Sede: CAL. TACNA NRO 5526 URB. SAN MIGUEL LIMA - LIMA',
    lote: 'L-DEL24-05'
  },
  {
    id: 4,
    productoId: 4,
    producto: 'LAPTOP DELL INSPIRON 15 3000',
    movimiento: 'Venta F001-64',
    tipoMovimiento: 'VENTA',
    fecha: '02/11/2026 19:10:19',
    cantidad: 1,
    sede: 'TECHMULTISER PRINCIPAL - Sede: CAL. TACNA NRO 5526 URB. SAN MIGUEL LIMA - LIMA',
    lote: 'L-INS24-08'
  },
  {
    id: 5,
    productoId: 1,
    producto: 'Unidad de Estado Solido Kingston 240gb A400',
    movimiento: 'Venta F001-63',
    tipoMovimiento: 'VENTA',
    fecha: '02/11/2026 19:08:27',
    cantidad: 1,
    sede: 'TECHMULTISER PRINCIPAL - Sede: CAL. TACNA NRO 5526 URB. SAN MIGUEL LIMA - LIMA',
    lote: 'L-SSD24-01'
  },
  {
    id: 6,
    productoId: 4,
    producto: 'LAPTOP DELL INSPIRON 15 3000',
    movimiento: 'Venta F001-63',
    tipoMovimiento: 'VENTA',
    fecha: '02/11/2026 19:08:27',
    cantidad: 1,
    sede: 'TECHMULTISER PRINCIPAL - Sede: CAL. TACNA NRO 5526 URB. SAN MIGUEL LIMA - LIMA',
    lote: 'L-INS24-08'
  },
  {
    id: 7,
    productoId: 7,
    producto: 'SPRITE 500 ML',
    movimiento: 'Venta B001-93 (Pack de 6)',
    tipoMovimiento: 'VENTA',
    fecha: '02/11/2026 19:07:30',
    cantidad: 6,
    sede: 'TECHMULTISER PRINCIPAL - Sede: CAL. TACNA NRO 5526 URB. SAN MIGUEL LIMA - LIMA',
    lote: 'L-BEB24-07'
  },
  {
    id: 8,
    productoId: 8,
    producto: 'COCA COLA 1 LITRO',
    movimiento: 'Venta B001-92 (pack de 6)',
    tipoMovimiento: 'VENTA',
    fecha: '02/11/2026 19:06:26',
    cantidad: 6,
    sede: 'TECHMULTISER PRINCIPAL - Sede: CAL. TACNA NRO 5526 URB. SAN MIGUEL LIMA - LIMA',
    lote: 'L-BEB24-09'
  },
  {
    id: 9,
    productoId: 9,
    producto: 'De material Drill nuevo mundo',
    movimiento: 'Venta B001-90',
    tipoMovimiento: 'VENTA',
    fecha: '02/11/2026 19:00:13',
    cantidad: 1,
    sede: 'TECHMULTISER PRINCIPAL - Sede: CAL. TACNA NRO 5526 URB. SAN MIGUEL LIMA - LIMA',
    lote: 'L-MAT24-15'
  },
  {
    id: 10,
    productoId: 10,
    producto: 'PAGO ANUAL DEL SERICIO EN LA NUBE (SISTEMA WEB PARA RESTAURANT)',
    movimiento: 'Venta F001-62 (SISTEMA WEB PARA RESTAURANT)',
    tipoMovimiento: 'VENTA',
    fecha: '02/11/2026 18:58:00',
    cantidad: 1,
    sede: 'TECHMULTISER PRINCIPAL - Sede: CAL. TACNA NRO 5526 URB. SAN MIGUEL LIMA - LIMA',
    lote: 'L-SRV24-01'
  }
];

interface InventarioPageProps {
  view?: 'movimientos' | 'kardex' | 'productos';
  defaultTab?: 'kardex' | 'productos' | 'movimientos';
}

export default function InventarioPage({ view, defaultTab }: InventarioPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determinar la vista activa (sincronizada con URL)
  const activeView: 'movimientos' | 'kardex' | 'productos' = useMemo(() => {
    if (view) return view;
    if (location.pathname === '/inventario/kardex') return 'kardex';
    if (location.pathname === '/productos' || location.pathname === '/inventario/productos') return 'productos';
    if (searchParams.get('sub') === 'kardex') return 'kardex';
    if (searchParams.get('sub') === 'productos') return 'productos';
    if (defaultTab) return defaultTab;
    return 'movimientos';
  }, [view, location.pathname, searchParams, defaultTab]);

  // Notificación flash
  const [notif, setNotif] = useState<string | null>(null);

  function showNotif(msg: string) {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3500);
  }

  /* =========================================================================
     ESTADOS SUBMÓDULO 1: ADMINISTRAR INVENTARIO (Screenshot 2)
     ========================================================================= */
  const [movimientos, setMovimientos] = useState<MovimientoItem[]>(INITIAL_MOVIMIENTOS);
  const [movFechaInicio, setMovFechaInicio] = useState('2026-11-05');
  const [movFechaFin, setMovFechaFin] = useState('2026-11-05');
  const [movPageSize, setMovPageSize] = useState(10);
  const [movSucursal, setMovSucursal] = useState('ALL');
  const [movSearch, setMovSearch] = useState('');
  const [movCurrentPage, setMovCurrentPage] = useState(1);

  // Modales Inventario
  const [modalAjusteOpen, setModalAjusteOpen] = useState(false);
  const [modalTransOpen, setModalTransOpen] = useState(false);

  // Formulario Ajuste de Inventario
  const [ajusteProducto, setAjusteProducto] = useState('Unidad de Estado Solido Kingston 240gb A400');
  const [ajusteLote, setAjusteLote] = useState('L-SSD24-01');
  const [ajusteTipo, setAjusteTipo] = useState<'INGRESO' | 'SALIDA'>('INGRESO');
  const [ajusteCantidad, setAjusteCantidad] = useState(10);
  const [ajusteMotivo, setAjusteMotivo] = useState('Conteo físico de inventario');
  const [ajusteRef, setAjusteRef] = useState('AJU-2026-001');

  // Formulario Transferencia Directa
  const [transOrigen, setTransOrigen] = useState('TECHMULTISER PRINCIPAL - Sede: CAL. TACNA NRO 5526');
  const [transDestino, setTransDestino] = useState('Sucursal 2 - Jesús María');
  const [transProducto, setTransProducto] = useState('Laptop Lenovo i8 zz');
  const [transCantidad, setTransCantidad] = useState(1);

  /* =========================================================================
     ESTADOS SUBMÓDULO 2: KARDEX (Screenshot 3)
     ========================================================================= */
  /* =========================================================================
     ESTADOS SUBMÓDULO 3: ADMINISTRAR PRODUCTOS
     ========================================================================= */
  const [productos, setProductos] = useState<ProductoItem[]>([]);
  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [prodSearch, setProdSearch] = useState(() => searchParams.get('buscar') ?? '');
  const [prodCategoria, setProdCategoria] = useState('ALL');
  const [prodEstado, setProdEstado] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');
  const [prodPageSize, setProdPageSize] = useState(10);
  const [prodCurrentPage, setProdCurrentPage] = useState(1);

  useEffect(() => {
    const query = searchParams.get('buscar');
    if (query !== null) { setProdSearch(query); setProdCategoria('ALL'); setProdEstado('TODOS'); setProdCurrentPage(1); }
  }, [searchParams]);

  // Modal Crear / Editar Producto
  const [modalProductOpen, setModalProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductoItem | null>(null);
  const [formCodigo, setFormCodigo] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formCategoriaId, setFormCategoriaId] = useState<number>(1);
  const [formUnidadBase, setFormUnidadBase] = useState('TABLETA');
  const [formPrecioVenta, setFormPrecioVenta] = useState('1.50');
  const [formStockMinimo, setFormStockMinimo] = useState('15');
  const [formStockInicial, setFormStockInicial] = useState('50');

  const [productError,setProductError]=useState('');
  const [productBusy,setProductBusy]=useState(false);
  const [canEditProducts,setCanEditProducts]=useState(false);
  const [formRequiereSerie,setFormRequiereSerie]=useState(false);
  const [formImage,setFormImage]=useState<File|null>(null);
  const [imagePreview,setImagePreview]=useState('');
  useEffect(()=>{if(!formImage){setImagePreview('');return;}const url=URL.createObjectURL(formImage);setImagePreview(url);return()=>URL.revokeObjectURL(url);},[formImage]);
  function mapProduct(p:ProductRecord):ProductoItem {return {...p,precioCompra:0,precioVenta:Number(p.precioVenta),stockDisponible:Number(p.stockDisponible),stockMinimo:Number(p.stockMinimo)};}
  // Cargar datos del backend
  useEffect(() => {
    async function loadBackendData() {
      try {
        const [prodRes, catRes, movRes, meRes] = await Promise.all([
          fetch('/api/productos'),
          fetch('/api/categorias'),
          fetch('/api/inventario/movimientos'),
          fetch('/api/auth/me')
        ]);

        if(meRes.ok){const session=await meRes.json();setCanEditProducts(session.user?.rol==='ADMINISTRADOR');}
        if (catRes.ok) {
          const catData = await catRes.json();
          if (Array.isArray(catData) && catData.length > 0) {
            setCategorias(catData);
          }
        }

        if (!prodRes.ok) throw new Error('No se pudo cargar el catálogo real.');
        const prodData:ProductRecord[]=await prodRes.json();
        setProductos(prodData.map(mapProduct));
        if (movRes.ok) {
          const movData = await movRes.json();
          if (Array.isArray(movData) && movData.length > 0) {
            const mappedMov: MovimientoItem[] = movData.map((m: any, idx: number) => ({
              id: m.id || idx + 1,
              productoId: m.productoId,
              producto: m.productoNombre || 'Producto',
              movimiento: m.referencia || `${m.tipo || 'MOVIMIENTO'} #${m.id}`,
              tipoMovimiento: (m.tipo as any) || 'VENTA',
              fecha: m.fecha ? new Date(m.fecha).toLocaleString('es-PE') : '05/11/2026 12:00:00',
              cantidad: m.cantidad || 1,
              sede: m.sede || 'TECHMULTISER PRINCIPAL - Sede: CAL. TACNA NRO 5526',
              lote: m.numeroLote || 'L-GENERAL'
            }));
            setMovimientos((prev) => [...mappedMov, ...prev]);
          }
        }
      } catch {
        setProductError('No pudimos cargar los productos reales. Recarga la página para reintentar.');
      }
    }
    loadBackendData();
  }, []);

  /* =========================================================================
     FILTRADO: ADMINISTRAR INVENTARIO (Screenshot 2)
     ========================================================================= */
  const movFiltrados = useMemo(() => {
    return movimientos.filter((m) => {
      const matchSearch =
        movSearch.trim() === '' ||
        m.producto.toLowerCase().includes(movSearch.toLowerCase()) ||
        m.movimiento.toLowerCase().includes(movSearch.toLowerCase()) ||
        m.lote.toLowerCase().includes(movSearch.toLowerCase());

      const matchSucursal =
        movSucursal === 'ALL' ||
        (movSucursal === 'PRINCIPAL' && m.sede.includes('PRINCIPAL')) ||
        (movSucursal === 'SUCURSAL_2' && m.sede.includes('SUCURSAL 2'));

      return matchSearch && matchSucursal;
    });
  }, [movimientos, movSearch, movSucursal]);

  const movTotalPages = Math.ceil(movFiltrados.length / movPageSize) || 1;
  const movPaginated = useMemo(() => {
    const start = (movCurrentPage - 1) * movPageSize;
    return movFiltrados.slice(start, start + movPageSize);
  }, [movFiltrados, movCurrentPage, movPageSize]);

  /* =========================================================================
     CÁLCULO MATEMÁTICO: TARJETA KARDEX (Screenshot 3)
     ========================================================================= */
  /* =========================================================================
     FILTRADO: ADMINISTRAR PRODUCTOS
     ========================================================================= */
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const matchSearch =
        prodSearch.trim() === '' ||
        p.nombre.toLowerCase().includes(prodSearch.toLowerCase()) ||
        p.codigo.toLowerCase().includes(prodSearch.toLowerCase());

      const matchCat = prodCategoria === 'ALL' || String(p.categoriaId) === prodCategoria || p.categoriaNombre === prodCategoria;

      const matchEstado =
        prodEstado === 'TODOS' ||
        (prodEstado === 'ACTIVOS' && p.activo) ||
        (prodEstado === 'INACTIVOS' && !p.activo);

      return matchSearch && matchCat && matchEstado;
    });
  }, [productos, prodSearch, prodCategoria, prodEstado]);

  const prodTotalPages = Math.ceil(productosFiltrados.length / prodPageSize) || 1;
  const prodPaginated = useMemo(() => {
    const start = (prodCurrentPage - 1) * prodPageSize;
    return productosFiltrados.slice(start, start + prodPageSize);
  }, [productosFiltrados, prodCurrentPage, prodPageSize]);

  const kpiTotal = productos.length;
  const kpiEnStock = productos.filter((p) => p.stockDisponible > 0).length;
  const kpiBajoStock = productos.filter((p) => p.stockDisponible <= p.stockMinimo).length;
  const kpiCategorias = categorias.length;

  /* =========================================================================
     HANDLERS: Ajuste, Transferencia, Producto
     ========================================================================= */
  async function handleGuardarAjuste(e: React.FormEvent) {
    e.preventDefault();
    const qtyFinal = ajusteTipo === 'INGRESO' ? Math.abs(ajusteCantidad) : -Math.abs(ajusteCantidad);
    const nuevoMov: MovimientoItem = {
      id: Date.now(),
      producto: ajusteProducto,
      movimiento: `Ajuste ${ajusteTipo === 'INGRESO' ? 'Ingreso' : 'Salida'} (${ajusteRef})`,
      tipoMovimiento: 'AJUSTE',
      fecha: new Date().toLocaleString('es-PE'),
      cantidad: Math.abs(qtyFinal),
      sede: 'TECHMULTISER PRINCIPAL - Sede: CAL. TACNA NRO 5526',
      lote: ajusteLote
    };

    setMovimientos((prev) => [nuevoMov, ...prev]);
    setModalAjusteOpen(false);
    showNotif(`Ajuste de inventario ${ajusteRef} registrado exitosamente.`);
  }

  function handleGuardarTransferencia(e: React.FormEvent) {
    e.preventDefault();
    const nuevoMov: MovimientoItem = {
      id: Date.now(),
      producto: transProducto,
      movimiento: `Transferencia ${transOrigen.split('-')[0].trim()} -> ${transDestino.split('-')[0].trim()}`,
      tipoMovimiento: 'TRANSFERENCIA',
      fecha: new Date().toLocaleString('es-PE'),
      cantidad: transCantidad,
      sede: 'TECHMULTISER PRINCIPAL - Sede: CAL. TACNA NRO 5526',
      lote: 'L-GENERAL'
    };

    setMovimientos((prev) => [nuevoMov, ...prev]);
    setModalTransOpen(false);
    showNotif(`Transferencia de ${transCantidad} unidades enviada exitosamente.`);
  }

  async function handleSaveProduct(e:React.FormEvent) {
    e.preventDefault();if(!editingProduct||productBusy||!canEditProducts)return;
    setProductBusy(true);setProductError('');
    try {
      const updated=await editProduct(editingProduct.id,{categoriaId:Number(formCategoriaId),nombre:formNombre.trim(),unidadBase:formUnidadBase,
        precioVenta:Number(formPrecioVenta),stockMinimo:Number(formStockMinimo),activo:editingProduct.activo,requiereSerie:formRequiereSerie},formImage);
      setProductos(old=>old.map(p=>p.id===updated.id?mapProduct(updated):p));setModalProductOpen(false);setFormImage(null);
      showNotif(`Producto "${updated.nombre}" actualizado correctamente.`);
    }catch(reason){setProductError(reason instanceof Error?reason.message:'No se pudo actualizar el producto.');}finally{setProductBusy(false);}
  }
  function openEditProductModal(p: ProductoItem) {
    setProductError('');setFormImage(null);setFormRequiereSerie(Boolean(p.requiereSerie));
    setEditingProduct(p);
    setFormCodigo(p.codigo);
    setFormNombre(p.nombre);
    setFormCategoriaId(p.categoriaId);
    setFormUnidadBase(p.unidadBase);
    setFormPrecioVenta(p.precioVenta.toFixed(2));
    setFormStockMinimo(String(p.stockMinimo));
    setFormStockInicial(String(p.stockDisponible));
    setModalProductOpen(true);
  }

  async function toggleProductStatus(p:ProductoItem) {
    if(productBusy||!canEditProducts)return;setProductBusy(true);setProductError('');
    try{const updated=await changeProductStatus(p.id,!p.activo);setProductos(old=>old.map(item=>item.id===updated.id?mapProduct(updated):item));showNotif(`Producto "${updated.nombre}" ${updated.activo?'activado':'desactivado'}.`);}
    catch(reason){setProductError(reason instanceof Error?reason.message:'No se pudo cambiar el estado.');}finally{setProductBusy(false);}
  }
  function verKardexDeProducto(p: ProductoItem) {
    navigate('/inventario/kardex?productoId=' + p.id);
    showNotif(`Visualizando Tarjeta Kardex de: ${p.nombre}`);
  }

  return (
    <div className="inv-page">
      {/* ================= 1. SUBHEADER BAR (SOLO EN KARDEX) ================= */}
      {activeView === 'kardex' && (
        <div className="inv-bar">
          <h1 className="inv-bar-title">
            <ClipboardList size={15} strokeWidth={2.2} /> KARDEX
          </h1>
          <div className="inv-actions">
            <Link to="/ventas?tipo=FACTURA" className="inv-dash-btn" title="Emitir Factura Electrónica">
              <FileText size={12} strokeWidth={2} /> EMITIR FACTURA
            </Link>
            <Link to="/ventas?tipo=BOLETA" className="inv-dash-btn" title="Emitir Boleta de Venta">
              <Receipt size={12} strokeWidth={2} /> EMITIR BOLETA
            </Link>
          </div>
        </div>
      )}

      {productError && <p className="inv-product-error" role="alert">{productError}</p>}
      {/* ================= NOTIFICACIÓN FLASH ================= */}
      {notif && (
        <div
          style={{
            background: '#d1fae5',
            color: '#065f46',
            border: '1px solid #6ee7b7',
            borderRadius: 8,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 600,
            fontSize: 12.5
          }}
        >
          <CheckCircle2 size={16} />
          <span>{notif}</span>
        </div>
      )}

      {/* =========================================================================
         VISTA 1: ADMINISTRACIÓN DE INVENTARIO (SCREENSHOT 2)
         ========================================================================= */}
      {activeView === 'movimientos' && (
        <div className="inv-card">
          {/* Header Row: Title + Transferencia Directa + Ajustes de Inventario */}
          <div className="inv-header-row">
            <h2 className="inv-title">ADMINISTRACIÓN DE INVENTARIO</h2>
            <div className="inv-top-buttons">
              <button
                type="button"
                className="btn-transfer"
                onClick={() => setModalTransOpen(true)}
                title="Realizar transferencia directa entre sedes"
              >
                <ArrowLeftRight size={13} /> TRANSFERENCIA DIRECTA
              </button>
              <button
                type="button"
                className="btn-adjust"
                onClick={() => setModalAjusteOpen(true)}
                title="Registrar ajuste de inventario"
              >
                <Plus size={13} /> AJUSTES DE INVENTARIO <LayoutGrid size={13} style={{ marginLeft: 4 }} />
              </button>
            </div>
          </div>

          {/* Filtros de Administrar Inventario */}
          <div className="inv-filters-grid">
            {/* Fila 1: Dos fechas */}
            <div className="inv-date-row">
              <div className="inv-date-box" title="Fecha inicio">
                <Calendar size={15} color="#475569" />
                <input
                  type="date"
                  value={movFechaInicio}
                  onChange={(e) => setMovFechaInicio(e.target.value)}
                  aria-label="Fecha inicio"
                />
              </div>
              <div className="inv-date-box" title="Fecha fin">
                <Calendar size={15} color="#475569" />
                <input
                  type="date"
                  value={movFechaFin}
                  onChange={(e) => setMovFechaFin(e.target.value)}
                  aria-label="Fecha fin"
                />
              </div>
            </div>

            {/* Fila 2: [10 v]  [SEDE v]  [BUSCAR POR NOMBRE O CÓDIGO DE BARRA] */}
            <div className="inv-kardex-row-2">
              <select
                className="inv-select-limit"
                value={movPageSize}
                onChange={(e) => {
                  setMovPageSize(Number(e.target.value));
                  setMovCurrentPage(1);
                }}
                title="Registros por página"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>

              <select
                className="inv-select-sucursal"
                value={movSucursal}
                onChange={(e) => {
                  setMovSucursal(e.target.value);
                  setMovCurrentPage(1);
                }}
                style={{ flex: 1.2 }}
                title="Filtrar por sede"
              >
                <option value="ALL">TECHMULTISER PRINCIPAL - Sede: CAL. TACNA NRO 5526 URB. SAN MIGUEL LIMA - LIMA - ...</option>
                <option value="SUCURSAL_2">SUCURSAL 2 - JESÚS MARÍA</option>
              </select>

              <div className="inv-search-wrap" style={{ flex: 1.5, maxWidth: 'none' }}>
                <input
                  type="text"
                  className="inv-search-input"
                  placeholder="BUSCAR POR NOMBRE O CÓDIGO DE BARRA"
                  value={movSearch}
                  onChange={(e) => {
                    setMovSearch(e.target.value);
                    setMovCurrentPage(1);
                  }}
                />
                <Search size={16} className="inv-search-icon" />
              </div>
            </div>
          </div>

          {/* Barra flotante de exportación */}
          <div className="inv-export-toolbar">
            <button
              type="button"
              className="btn-export btn-export-pdf"
              onClick={() => window.print()}
              title="Exportar a PDF / Imprimir"
            >
              <FileText size={15} />
            </button>
            <button
              type="button"
              className="btn-export btn-export-excel"
              onClick={() => {
                const csv = 'data:text/csv;charset=utf-8,\uFEFF' +
                  ['#,PRODUCTO,MOVIMIENTO,FECHA,CANTIDAD', ...movFiltrados.map((m, idx) => `${idx + 1},"${m.producto}","${m.movimiento}","${m.fecha}",${m.cantidad}`)].join('\n');
                const link = document.createElement('a');
                link.href = encodeURI(csv);
                link.download = `inventario_${Date.now()}.csv`;
                link.click();
              }}
              title="Descargar reporte en Excel (.CSV)"
            >
              <FileSpreadsheet size={15} />
            </button>
            <button
              type="button"
              className="btn-export btn-export-config"
              onClick={() => {
                setMovSearch('');
                setMovSucursal('ALL');
                showNotif('Filtros restaurados.');
              }}
              title="Restablecer filtros"
            >
              <Settings size={15} />
            </button>
          </div>

          {/* Tabla de Movimientos de Inventario (Screenshot 2) */}
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}>#</th>
                  <th>PRODUCTO</th>
                  <th style={{ width: 340 }}>MOVIMIENTO</th>
                  <th style={{ width: 180 }}>FECHA</th>
                  <th style={{ width: 110, textAlign: 'right', paddingRight: 20 }}>CANTIDAD</th>
                </tr>
              </thead>
              <tbody>
                {movPaginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="inv-empty">
                      No se encontraron movimientos de inventario que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  movPaginated.map((item, idx) => {
                    const globalIdx = (movCurrentPage - 1) * movPageSize + idx + 1;
                    return (
                      <tr key={item.id}>
                        <td className="inv-td-num">{globalIdx}</td>
                        <td className="inv-td-product">
                          <div className="inv-product-name">{item.producto}</div>
                        </td>
                        <td className="inv-td-mov">
                          {item.movimiento}
                        </td>
                        <td className="inv-td-date">
                          {item.fecha}
                        </td>
                        <td className="inv-td-qty">
                          {item.cantidad}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="inv-pagination">
            <span>
              Mostrando {movFiltrados.length === 0 ? 0 : (movCurrentPage - 1) * movPageSize + 1} a{' '}
              {Math.min(movCurrentPage * movPageSize, movFiltrados.length)} de {movFiltrados.length} movimientos
            </span>
            <div className="inv-page-btns">
              <button
                type="button"
                className="inv-btn-nav"
                disabled={movCurrentPage === 1}
                onClick={() => setMovCurrentPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>
              {Array.from({ length: Math.min(5, movTotalPages) }).map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    type="button"
                    className={`inv-btn-nav ${movCurrentPage === p ? 'active' : ''}`}
                    onClick={() => setMovCurrentPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
              {movTotalPages > 5 && <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>}
              {movTotalPages > 5 && (
                <button
                  type="button"
                  className={`inv-btn-nav ${movCurrentPage === movTotalPages ? 'active' : ''}`}
                  onClick={() => setMovCurrentPage(movTotalPages)}
                >
                  {movTotalPages}
                </button>
              )}
              <button
                type="button"
                className="inv-btn-nav"
                disabled={movCurrentPage >= movTotalPages}
                onClick={() => setMovCurrentPage((p) => Math.min(movTotalPages, p + 1))}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
         VISTA 2: ADMINISTRACIÓN DE KARDEX (SCREENSHOT 3)
         ========================================================================= */}
      {activeView === 'kardex' && <KardexPage key={searchParams.get('productoId') ?? ''} initialProductId={searchParams.get('productoId') ?? ''} source={kardexSource} />}

      {/* =========================================================================
         VISTA 3: ADMINISTRACIÓN DE PRODUCTOS
         ========================================================================= */}
      {activeView === 'productos' && (
        <div className="inv-card">
          <div className="inv-header-row">
            <div>
              <h2 className="inv-title">ADMINISTRACIÓN DE PRODUCTOS</h2>
              <span style={{ fontSize: 11.5, color: '#64748b' }}>
                Catálogo general de medicamentos, materiales, precios de venta y control de existencias
              </span>
            </div>
          </div>

          {/* KPI Ribbon de Productos - 3D Realistic Badges */}
          <div className="prod-kpi-ribbon">
            <div className="prod-kpi-card">
              <div className="prod-kpi-icon total" title="Total de productos registrados">
                <Package size={22} strokeWidth={2.2} />
              </div>
              <div className="prod-kpi-info">
                <span className="prod-kpi-val">{kpiTotal}</span>
                <span className="prod-kpi-label">Total Productos</span>
              </div>
            </div>

            <div className="prod-kpi-card">
              <div className="prod-kpi-icon stock" title="Productos con existencias disponibles">
                <CheckCircle2 size={22} strokeWidth={2.2} />
              </div>
              <div className="prod-kpi-info">
                <span className="prod-kpi-val">{kpiEnStock}</span>
                <span className="prod-kpi-label">Con Existencias</span>
              </div>
            </div>

            <div className="prod-kpi-card">
              <div className="prod-kpi-icon critico" title="Productos con stock igual o menor al mínimo">
                <TrendingDown size={22} strokeWidth={2.2} />
              </div>
              <div className="prod-kpi-info">
                <span className="prod-kpi-val">{kpiBajoStock}</span>
                <span className="prod-kpi-label">Stock Crítico (≤ Mín)</span>
              </div>
            </div>

            <div className="prod-kpi-card">
              <div className="prod-kpi-icon cat" title="Categorías terapéuticas activas">
                <Layers size={22} strokeWidth={2.2} />
              </div>
              <div className="prod-kpi-info">
                <span className="prod-kpi-val">{kpiCategorias}</span>
                <span className="prod-kpi-label">Categorías</span>
              </div>
            </div>
          </div>

          {/* Filtros de Productos */}
          <div className="prod-actions-row">
            <div className="prod-filters-left">
              <select
                className="inv-select-limit"
                value={prodPageSize}
                onChange={(e) => {
                  setProdPageSize(Number(e.target.value));
                  setProdCurrentPage(1);
                }}
                title="Registros por página"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>

              <select
                className="inv-select-sucursal"
                value={prodCategoria}
                onChange={(e) => {
                  setProdCategoria(e.target.value);
                  setProdCurrentPage(1);
                }}
                title="Filtrar por categoría"
              >
                <option value="ALL">TODAS LAS CATEGORÍAS</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>

              <div className="inv-search-wrap">
                <input
                  type="text"
                  className="inv-search-input"
                  placeholder="BUSCAR POR NOMBRE O CÓDIGO..."
                  value={prodSearch}
                  onChange={(e) => {
                    setProdSearch(e.target.value);
                    setProdCurrentPage(1);
                  }}
                />
                <Search size={16} className="inv-search-icon" />
              </div>

              <select
                className="inv-select-limit"
                value={prodEstado}
                onChange={(e) => {
                  setProdEstado(e.target.value as any);
                  setProdCurrentPage(1);
                }}
                style={{ minWidth: 110 }}
                title="Filtrar por estado"
              >
                <option value="TODOS">TODOS</option>
                <option value="ACTIVOS">ACTIVOS</option>
                <option value="INACTIVOS">INACTIVOS</option>
              </select>
            </div>
          </div>

          {/* Tabla de Productos */}
          <div className="kardex-table-wrap">
            <table className="kardex-table">
              <thead>
                <tr className="kardex-cols-row">
                  <th style={{ width: 110 }}>CÓDIGO</th>
                  <th>DESCRIPCIÓN DEL PRODUCTO</th>
                  <th style={{ width: 140 }}>CATEGORÍA</th>
                  <th style={{ width: 110 }} className="kardex-td-center">UNIDAD</th>
                  <th style={{ width: 110 }} className="kardex-td-right">P. VENTA</th>
                  <th style={{ width: 110 }} className="kardex-td-center">STOCK</th>
                  <th style={{ width: 100 }} className="kardex-td-center">ESTADO</th>
                  <th style={{ width: 120 }} className="kardex-td-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {prodPaginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '30px 14px', color: '#64748b' }}>
                      No se encontraron productos que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  prodPaginated.map((p) => {
                    const isLow = p.stockDisponible <= p.stockMinimo;
                    const isEmpty = p.stockDisponible <= 0;

                    return (
                      <tr key={p.id}>
                        <td>
                          <span className="prod-code-badge">
                            <Barcode size={12} /> {p.codigo}
                          </span>
                        </td>
                        <td>
                          <div className="prod-name-primary">{p.nombre}</div>
                          <span className="prod-name-sub">
                            Mínimo sugerido: {p.stockMinimo} {p.unidadBase}s
                          </span>
                        </td>
                        <td>
                          <span className="prod-cat-badge">{p.categoriaNombre}</span>
                        </td>
                        <td className="kardex-td-center prod-unit-cell">
                          {p.unidadBase}
                        </td>
                        <td className="kardex-td-right prod-price-cell">
                          S/ {p.precioVenta.toFixed(2)}
                        </td>
                        <td className="kardex-td-center">
                          <span
                            className={`prod-stock-pill ${
                              isEmpty ? 'prod-stock-empty' : isLow ? 'prod-stock-low' : 'prod-stock-ok'
                            }`}
                          >
                            {p.stockDisponible}
                          </span>
                        </td>
                        <td className="kardex-td-center">
                          <button
                            type="button"
                            className={`prod-status-toggle ${
                              p.activo ? 'prod-status-active' : 'prod-status-inactive'
                            }`}
                            disabled={!canEditProducts||productBusy}
                              onClick={() => void toggleProductStatus(p)}
                            title="Alternar estado Activo / Inactivo"
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: p.activo ? '#16a34a' : '#94a3b8'
                              }}
                            />
                            {p.activo ? 'ACTIVO' : 'INACTIVO'}
                          </button>
                        </td>
                        <td className="kardex-td-center">
                          <div className="prod-action-btns">
                            <button
                              type="button"
                              className="btn-prod-action edit"
                              disabled={!canEditProducts||productBusy}
                              onClick={() => openEditProductModal(p)}
                              title="Editar producto"
                              aria-label="Editar producto"
                            >
                              <PenSquare size={13} strokeWidth={2.2} />
                            </button>
                            <button
                              type="button"
                              className="btn-prod-action kardex"
                              onClick={() => verKardexDeProducto(p)}
                              title="Ver Tarjeta Kardex de este producto"
                              aria-label="Ver Tarjeta Kardex"
                            >
                              <ClipboardList size={13} strokeWidth={2.2} />
                            </button>
                            <button
                              type="button"
                              className={`btn-prod-action power ${p.activo ? 'is-active' : 'is-inactive'}`}
                              disabled={!canEditProducts||productBusy}
                              onClick={() => void toggleProductStatus(p)}
                              title={p.activo ? 'Desactivar producto' : 'Activar producto'}
                              aria-label={p.activo ? 'Desactivar producto' : 'Activar producto'}
                            >
                              <Power size={13} strokeWidth={2.2} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="inv-pagination">
            <span>
              Mostrando {productosFiltrados.length === 0 ? 0 : (prodCurrentPage - 1) * prodPageSize + 1} a{' '}
              {Math.min(prodCurrentPage * prodPageSize, productosFiltrados.length)} de {productosFiltrados.length} productos
            </span>
            <div className="inv-page-btns">
              <button
                type="button"
                className="inv-btn-nav"
                disabled={prodCurrentPage === 1}
                onClick={() => setProdCurrentPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>
              {Array.from({ length: Math.min(5, prodTotalPages) }).map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    type="button"
                    className={`inv-btn-nav ${prodCurrentPage === p ? 'active' : ''}`}
                    onClick={() => setProdCurrentPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                type="button"
                className="inv-btn-nav"
                disabled={prodCurrentPage >= prodTotalPages}
                onClick={() => setProdCurrentPage((p) => Math.min(prodTotalPages, p + 1))}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL AJUSTE DE INVENTARIO ================= */}
      {modalAjusteOpen && (
        <div className="inv-modal-overlay" onClick={() => setModalAjusteOpen(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3 className="inv-modal-title">Ajustes de Inventario</h3>
              <button
                type="button"
                className="inv-modal-close"
                onClick={() => setModalAjusteOpen(false)}
                title="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGuardarAjuste} className="inv-modal-form">
              <div className="inv-form-group">
                <label>Producto a Ajustar</label>
                <select value={ajusteProducto} onChange={(e) => setAjusteProducto(e.target.value)}>
                  {productos.map((prod) => (
                    <option key={prod.id} value={prod.nombre}>
                      {prod.nombre} (Stock: {prod.stockDisponible})
                    </option>
                  ))}
                </select>
              </div>

              <div className="inv-form-row-2">
                <div className="inv-form-group">
                  <label>Tipo de Ajuste</label>
                  <select value={ajusteTipo} onChange={(e) => setAjusteTipo(e.target.value as any)}>
                    <option value="INGRESO">Ingreso (+ Existencias)</option>
                    <option value="SALIDA">Salida (- Merma/Deterioro)</option>
                  </select>
                </div>

                <div className="inv-form-group">
                  <label>Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={ajusteCantidad}
                    onChange={(e) => setAjusteCantidad(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div className="inv-form-row-2">
                <div className="inv-form-group">
                  <label>Lote</label>
                  <input
                    type="text"
                    value={ajusteLote}
                    onChange={(e) => setAjusteLote(e.target.value)}
                    placeholder="L-2026-01"
                  />
                </div>

                <div className="inv-form-group">
                  <label>N° Referencia</label>
                  <input
                    type="text"
                    value={ajusteRef}
                    onChange={(e) => setAjusteRef(e.target.value)}
                    placeholder="AJU-001"
                  />
                </div>
              </div>

              <div className="inv-form-group">
                <label>Motivo del Ajuste</label>
                <textarea
                  rows={2}
                  value={ajusteMotivo}
                  onChange={(e) => setAjusteMotivo(e.target.value)}
                  placeholder="Detalle la justificación del ajuste físico..."
                />
              </div>

              <div className="inv-modal-footer">
                <button
                  type="button"
                  className="inv-btn-cancel"
                  onClick={() => setModalAjusteOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="inv-btn-submit">
                  Guardar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TRANSFERENCIA ENTRE SEDES ================= */}
      {modalTransOpen && (
        <div className="inv-modal-overlay" onClick={() => setModalTransOpen(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3 className="inv-modal-title">Transferencia Directa entre Sedes</h3>
              <button
                type="button"
                className="inv-modal-close"
                onClick={() => setModalTransOpen(false)}
                title="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGuardarTransferencia} className="inv-modal-form">
              <div className="inv-form-group">
                <label>Sede Origen</label>
                <select value={transOrigen} onChange={(e) => setTransOrigen(e.target.value)}>
                  <option value="TECHMULTISER PRINCIPAL - Sede: CAL. TACNA NRO 5526">TECHMULTISER PRINCIPAL - Sede: CAL. TACNA NRO 5526</option>
                  <option value="Sucursal 2 - Jesús María">Sucursal 2 - Jesús María</option>
                </select>
              </div>

              <div className="inv-form-group">
                <label>Sede Destino</label>
                <select value={transDestino} onChange={(e) => setTransDestino(e.target.value)}>
                  <option value="Sucursal 2 - Jesús María">Sucursal 2 - Jesús María</option>
                  <option value="TECHMULTISER PRINCIPAL - Sede: CAL. TACNA NRO 5526">TECHMULTISER PRINCIPAL - Sede: CAL. TACNA NRO 5526</option>
                </select>
              </div>

              <div className="inv-form-group">
                <label>Producto a Transferir</label>
                <select value={transProducto} onChange={(e) => setTransProducto(e.target.value)}>
                  {productos.map((prod) => (
                    <option key={prod.id} value={prod.nombre}>
                      {prod.nombre} (Disp: {prod.stockDisponible})
                    </option>
                  ))}
                </select>
              </div>

              <div className="inv-form-group">
                <label>Cantidad de Unidades</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={transCantidad}
                  onChange={(e) => setTransCantidad(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="inv-modal-footer">
                <button
                  type="button"
                  className="inv-btn-cancel"
                  onClick={() => setModalTransOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="inv-btn-submit">
                  Transferir Unidades
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL CREAR / EDITAR PRODUCTO ================= */}
      {modalProductOpen && (
        <div className="inv-modal-overlay" onClick={() => {if(!productBusy)setModalProductOpen(false);}}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="inv-modal-header">
              <h3 className="inv-modal-title">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto en Catálogo'}
              </h3>
              <button
                type="button"
                className="inv-modal-close"
                disabled={productBusy}
                onClick={() => setModalProductOpen(false)}
                title="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="inv-modal-form">
              <fieldset className="inv-product-fields" disabled={productBusy}>
              {productError&&<p className="inv-product-error" role="alert">{productError}</p>}
              <div className="inv-product-image-field">
                <img src={imagePreview||editingProduct?.imagenUrl||'/images/product-placeholder.svg'} alt="Vista previa del producto" width={120} height={90}/>
                <label htmlFor="edit-product-image">Imagen del producto (PNG o JPEG, máximo 2 MB)</label>
                <input id="edit-product-image" type="file" accept="image/png,image/jpeg" onChange={e=>{
                  const file=e.target.files?.[0]??null;
                  if(file&&(!['image/png','image/jpeg'].includes(file.type)||file.size>2*1024*1024)){setProductError('Selecciona una imagen PNG o JPEG de hasta 2 MB.');e.target.value='';setFormImage(null);return;}
                  setProductError('');setFormImage(file);
                }}/>
              </div>
              <div className="inv-form-row-2">
                <div className="inv-form-group">
                  <label>Código de Barras / SKU *</label>
                  <input
                    type="text"
                    required
                    value={formCodigo}
                    readOnly
                    placeholder="Ej. MED-015"
                  />
                </div>

                <div className="inv-form-group">
                  <label>Categoría *</label>
                  <select
                    value={formCategoriaId}
                    onChange={(e) => setFormCategoriaId(Number(e.target.value))}
                  >
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="inv-form-group">
                <label>Nombre Comercial y Presentación *</label>
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  placeholder="Ej. Paracetamol 500mg Tabletas - Laboratorio Genfar"
                />
              </div>

              <div className="inv-form-row-2">
                <div className="inv-form-group">
                  <label>Unidad Base *</label>
                  <select
                    value={formUnidadBase}
                    onChange={(e) => setFormUnidadBase(e.target.value)}
                  >
                    <option value="TABLETA">TABLETA</option>
                    <option value="CÁPSULA">CÁPSULA</option>
                    <option value="CAJA">CAJA</option>
                    <option value="FRASCO">FRASCO</option>
                    <option value="BLISTER">BLISTER</option>
                    <option value="UNIDAD">UNIDAD</option>
                  </select>
                </div>

                <div className="inv-form-group">
                  <label>Precio de Venta (S/) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formPrecioVenta}
                    onChange={(e) => setFormPrecioVenta(e.target.value)}
                  />
                </div>
              </div>

              <div className="inv-form-row-2">
                <div className="inv-form-group">
                  <label>Stock Mínimo de Alerta</label>
                  <input
                    type="number"
                    min="0"
                    value={formStockMinimo}
                    onChange={(e) => setFormStockMinimo(e.target.value)}
                  />
                </div>

                <div className="inv-form-group">
                  <label>Stock disponible (solo consulta)</label>
                  <input
                    type="number"
                    min="0"
                    value={formStockInicial}
                    readOnly
                  />
                </div>
              </div>

              <p className="inv-product-help">Las existencias se actualizan desde Compras y Ajustes de inventario, conservando sus movimientos.</p>
              <label className="inv-product-series"><input type="checkbox" checked={formRequiereSerie} onChange={e=>setFormRequiereSerie(e.target.checked)}/>Este producto tiene serie única por unidad</label>

              <div className="inv-modal-footer">
                <button
                  type="button"
                  className="inv-btn-cancel"
                  onClick={() => setModalProductOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="inv-btn-submit">
                  {productBusy ? 'Guardando…' : 'Actualizar Producto'}
                </button>
              </div>
              </fieldset>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
