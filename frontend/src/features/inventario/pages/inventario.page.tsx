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
}

export interface CategoriaItem {
  id: number;
  nombre: string;
}

/* ================= INITIAL DEMO PRODUCTS ================= */
const INITIAL_PRODUCTOS: ProductoItem[] = [
  {
    id: 1,
    codigo: 'MED-001',
    nombre: 'Paracetamol 500mg Tabletas - Genfar',
    categoriaId: 1,
    categoriaNombre: 'Analgésicos',
    unidadBase: 'TABLETA',
    precioCompra: 0.25,
    precioVenta: 0.80,
    stockDisponible: 95,
    stockMinimo: 20,
    activo: true
  },
  {
    id: 2,
    codigo: 'MED-002',
    nombre: 'Amoxicilina 500mg Cápsulas - Medifarma',
    categoriaId: 2,
    categoriaNombre: 'Antibióticos',
    unidadBase: 'CÁPSULA',
    precioCompra: 0.60,
    precioVenta: 1.50,
    stockDisponible: 19,
    stockMinimo: 25,
    activo: true
  },
  {
    id: 3,
    codigo: 'MED-003',
    nombre: 'Ibuprofeno 400mg Tabletas - Farmaindustria',
    categoriaId: 1,
    categoriaNombre: 'Analgésicos',
    unidadBase: 'TABLETA',
    precioCompra: 0.35,
    precioVenta: 1.00,
    stockDisponible: 48,
    stockMinimo: 15,
    activo: true
  },
  {
    id: 4,
    codigo: 'MED-004',
    nombre: 'Azitromicina 500mg Caja x 3 - Lab Portugal',
    categoriaId: 2,
    categoriaNombre: 'Antibióticos',
    unidadBase: 'CAJA',
    precioCompra: 8.50,
    precioVenta: 18.00,
    stockDisponible: 24,
    stockMinimo: 10,
    activo: true
  },
  {
    id: 5,
    codigo: 'MED-005',
    nombre: 'Alcohol Medicinal 70° 1 Litro - Alkofarma',
    categoriaId: 3,
    categoriaNombre: 'Antisépticos',
    unidadBase: 'FRASCO',
    precioCompra: 6.00,
    precioVenta: 12.00,
    stockDisponible: 45,
    stockMinimo: 12,
    activo: true
  },
  {
    id: 6,
    codigo: 'MED-006',
    nombre: 'Panadol Antigripal Tableta x 24 - GSK',
    categoriaId: 1,
    categoriaNombre: 'Analgésicos',
    unidadBase: 'CAJA',
    precioCompra: 14.00,
    precioVenta: 26.00,
    stockDisponible: 30,
    stockMinimo: 8,
    activo: true
  },
  {
    id: 7,
    codigo: 'MED-007',
    nombre: 'Suero Fisiológico 0.9% 500ml - Braun',
    categoriaId: 4,
    categoriaNombre: 'Material Médico',
    unidadBase: 'FRASCO',
    precioCompra: 3.50,
    precioVenta: 7.50,
    stockDisponible: 82,
    stockMinimo: 20,
    activo: true
  },
  {
    id: 8,
    codigo: 'MED-008',
    nombre: 'Bismutol Suspensión 150ml - Bagó',
    categoriaId: 5,
    categoriaNombre: 'Gastrointestinal',
    unidadBase: 'FRASCO',
    precioCompra: 12.00,
    precioVenta: 22.50,
    stockDisponible: 16,
    stockMinimo: 10,
    activo: true
  },
  {
    id: 9,
    codigo: 'MED-009',
    nombre: 'Mascarillas Quirúrgicas 3 pliegues Caja x 50',
    categoriaId: 4,
    categoriaNombre: 'Material Médico',
    unidadBase: 'CAJA',
    precioCompra: 5.00,
    precioVenta: 12.00,
    stockDisponible: 4,
    stockMinimo: 10,
    activo: true
  },
  {
    id: 10,
    codigo: 'MED-010',
    nombre: 'Omeprazol 20mg Cápsulas - Farmaindustria',
    categoriaId: 5,
    categoriaNombre: 'Gastrointestinal',
    unidadBase: 'CÁPSULA',
    precioCompra: 0.40,
    precioVenta: 1.20,
    stockDisponible: 120,
    stockMinimo: 30,
    activo: true
  }
];

const INITIAL_CATEGORIAS: CategoriaItem[] = [
  { id: 1, nombre: 'Analgésicos' },
  { id: 2, nombre: 'Antibióticos' },
  { id: 3, nombre: 'Antisépticos' },
  { id: 4, nombre: 'Material Médico' },
  { id: 5, nombre: 'Gastrointestinal' },
  { id: 6, nombre: 'Equipos' }
];

/* ================= INITIAL DEMO MOVEMENTS ================= */
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
  const [kardexFechaInicio, setKardexFechaInicio] = useState('2026-11-05');
  const [kardexFechaFin, setKardexFechaFin] = useState('2026-11-05');
  const [kardexPageSize, setKardexPageSize] = useState(10);
  const [kardexSucursal, setKardexSucursal] = useState('ALL');
  const [kardexProductoId, setKardexProductoId] = useState<string>('ALL');
  const [kardexCurrentPage, setKardexCurrentPage] = useState(1);

  /* =========================================================================
     ESTADOS SUBMÓDULO 3: ADMINISTRAR PRODUCTOS
     ========================================================================= */
  const [productos, setProductos] = useState<ProductoItem[]>(INITIAL_PRODUCTOS);
  const [categorias, setCategorias] = useState<CategoriaItem[]>(INITIAL_CATEGORIAS);
  const [prodSearch, setProdSearch] = useState('');
  const [prodCategoria, setProdCategoria] = useState('ALL');
  const [prodEstado, setProdEstado] = useState<'TODOS' | 'ACTIVOS' | 'INACTIVOS'>('TODOS');
  const [prodPageSize, setProdPageSize] = useState(10);
  const [prodCurrentPage, setProdCurrentPage] = useState(1);

  // Modal Crear / Editar Producto
  const [modalProductOpen, setModalProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductoItem | null>(null);
  const [formCodigo, setFormCodigo] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formCategoriaId, setFormCategoriaId] = useState<number>(1);
  const [formUnidadBase, setFormUnidadBase] = useState('TABLETA');
  const [formPrecioCompra, setFormPrecioCompra] = useState('0.50');
  const [formPrecioVenta, setFormPrecioVenta] = useState('1.50');
  const [formStockMinimo, setFormStockMinimo] = useState('15');
  const [formStockInicial, setFormStockInicial] = useState('50');

  // Cargar datos del backend
  useEffect(() => {
    async function loadBackendData() {
      try {
        const [prodRes, catRes, movRes] = await Promise.all([
          fetch('/api/productos'),
          fetch('/api/categorias'),
          fetch('/api/inventario/movimientos')
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          if (Array.isArray(catData) && catData.length > 0) {
            setCategorias(catData);
          }
        }

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          if (Array.isArray(prodData) && prodData.length > 0) {
            const mapped: ProductoItem[] = prodData.map((p: any) => ({
              id: p.id,
              codigo: p.codigo || `PRD-${p.id}`,
              nombre: p.nombre,
              categoriaId: p.categoriaId || 1,
              categoriaNombre: p.categoriaNombre || 'General',
              unidadBase: p.unidadBase || 'UNIDAD',
              precioCompra: Number(p.precioCompra) || 0.50,
              precioVenta: Number(p.precioVenta) || 1.50,
              stockDisponible: Number(p.stockDisponible) || 0,
              stockMinimo: Number(p.stockMinimo) || 10,
              activo: p.activo !== false
            }));
            const backendIds = new Set(mapped.map((m) => m.id));
            const remainingDemos = INITIAL_PRODUCTOS.filter((d) => !backendIds.has(d.id));
            setProductos([...mapped, ...remainingDemos]);
          }
        }

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
        // Fallback demo local
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
  const kardexCalculated = useMemo(() => {
    let list = movimientos.filter((m) => {
      const matchSucursal =
        kardexSucursal === 'ALL' ||
        (kardexSucursal === 'PRINCIPAL' && m.sede.includes('PRINCIPAL')) ||
        (kardexSucursal === 'SUCURSAL_2' && m.sede.includes('SUCURSAL 2'));

      const matchProducto =
        kardexProductoId === 'ALL' ||
        String(m.productoId) === kardexProductoId ||
        m.producto.toLowerCase().includes(kardexProductoId.toLowerCase());

      return matchSucursal && matchProducto;
    });

    let balance = 100;
    return list.map((item) => {
      const isEntrada = item.tipoMovimiento === 'COMPRA' || (item.tipoMovimiento === 'AJUSTE' && item.movimiento.includes('Ingreso'));
      const isSalida = item.tipoMovimiento === 'VENTA' || item.tipoMovimiento === 'TRANSFERENCIA' || (item.tipoMovimiento === 'AJUSTE' && !item.movimiento.includes('Ingreso'));

      const entrada = isEntrada ? item.cantidad : 0;
      const salida = isSalida ? item.cantidad : 0;
      const invInicial = balance;
      const invFinal = invInicial + entrada - salida;
      balance = invFinal;

      return {
        ...item,
        invInicial,
        entrada,
        salida,
        invFinal
      };
    });
  }, [movimientos, kardexSucursal, kardexProductoId]);

  const kardexTotalPages = Math.ceil(kardexCalculated.length / kardexPageSize) || 1;
  const kardexPaginated = useMemo(() => {
    const start = (kardexCurrentPage - 1) * kardexPageSize;
    return kardexCalculated.slice(start, start + kardexPageSize);
  }, [kardexCalculated, kardexCurrentPage, kardexPageSize]);

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

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!formNombre.trim()) return;

    const catObj = categorias.find((c) => c.id === Number(formCategoriaId));
    const catName = catObj ? catObj.nombre : 'General';

    if (editingProduct) {
      const updated: ProductoItem = {
        ...editingProduct,
        codigo: formCodigo.trim(),
        nombre: formNombre.trim(),
        categoriaId: Number(formCategoriaId),
        categoriaNombre: catName,
        unidadBase: formUnidadBase,
        precioCompra: parseFloat(formPrecioCompra) || 0,
        precioVenta: parseFloat(formPrecioVenta) || 0,
        stockMinimo: parseInt(formStockMinimo) || 0,
        stockDisponible: parseInt(formStockInicial) || editingProduct.stockDisponible
      };

      setProductos((prev) => prev.map((p) => (p.id === editingProduct.id ? updated : p)));
      setModalProductOpen(false);
      showNotif(`Producto "${updated.nombre}" actualizado.`);
    } else {
      const nuevo: ProductoItem = {
        id: Date.now(),
        codigo: formCodigo.trim() || `PRD-${Date.now().toString().slice(-4)}`,
        nombre: formNombre.trim(),
        categoriaId: Number(formCategoriaId),
        categoriaNombre: catName,
        unidadBase: formUnidadBase,
        precioCompra: parseFloat(formPrecioCompra) || 0,
        precioVenta: parseFloat(formPrecioVenta) || 0,
        stockDisponible: parseInt(formStockInicial) || 0,
        stockMinimo: parseInt(formStockMinimo) || 0,
        activo: true
      };

      setProductos((prev) => [nuevo, ...prev]);
      setModalProductOpen(false);
      showNotif(`Producto "${nuevo.nombre}" creado exitosamente.`);
    }
  }

  function openCreateProductModal() {
    setEditingProduct(null);
    setFormCodigo(`MED-${String(productos.length + 1).padStart(3, '0')}`);
    setFormNombre('');
    setFormCategoriaId(categorias[0]?.id || 1);
    setFormUnidadBase('TABLETA');
    setFormPrecioCompra('0.50');
    setFormPrecioVenta('1.50');
    setFormStockMinimo('15');
    setFormStockInicial('50');
    setModalProductOpen(true);
  }

  function openEditProductModal(p: ProductoItem) {
    setEditingProduct(p);
    setFormCodigo(p.codigo);
    setFormNombre(p.nombre);
    setFormCategoriaId(p.categoriaId);
    setFormUnidadBase(p.unidadBase);
    setFormPrecioCompra(p.precioCompra.toFixed(2));
    setFormPrecioVenta(p.precioVenta.toFixed(2));
    setFormStockMinimo(String(p.stockMinimo));
    setFormStockInicial(String(p.stockDisponible));
    setModalProductOpen(true);
  }

  function toggleProductStatus(p: ProductoItem) {
    const nextStatus = !p.activo;
    setProductos((prev) => prev.map((item) => (item.id === p.id ? { ...item, activo: nextStatus } : item)));
    showNotif(`Producto "${p.nombre}" marcado como ${nextStatus ? 'ACTIVO' : 'INACTIVO'}.`);
  }

  function verKardexDeProducto(p: ProductoItem) {
    setKardexProductoId(String(p.id));
    navigate('/inventario/kardex');
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
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.producto}</div>
                        </td>
                        <td className="inv-td-mov" style={{ color: '#475569', fontWeight: 600 }}>
                          {item.movimiento}
                        </td>
                        <td className="inv-td-date" style={{ color: '#64748b' }}>
                          {item.fecha}
                        </td>
                        <td className="inv-td-qty" style={{ textAlign: 'right', paddingRight: 24, fontWeight: 700 }}>
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
      {activeView === 'kardex' && (
        <div className="inv-card">
          <div className="inv-header-row">
            <h2 className="inv-title">ADMINISTRACIÓN DE KARDEX</h2>
          </div>

          {/* Filtros idénticos a Screenshot 3 */}
          <div className="inv-filters-grid">
            {/* Fila 1: Dos fechas */}
            <div className="inv-date-row">
              <div className="inv-date-box" title="Fecha inicio">
                <Calendar size={15} color="#475569" />
                <input
                  type="date"
                  value={kardexFechaInicio}
                  onChange={(e) => setKardexFechaInicio(e.target.value)}
                  aria-label="Fecha inicio"
                />
              </div>
              <div className="inv-date-box" title="Fecha fin">
                <Calendar size={15} color="#475569" />
                <input
                  type="date"
                  value={kardexFechaFin}
                  onChange={(e) => setKardexFechaFin(e.target.value)}
                  aria-label="Fecha fin"
                />
              </div>
            </div>

            {/* Fila 2: [10 v]  [SUCURSAL v]  [BUSCAR EL PRODUCTO v] */}
            <div className="inv-kardex-row-2">
              <select
                className="inv-select-limit"
                value={kardexPageSize}
                onChange={(e) => {
                  setKardexPageSize(Number(e.target.value));
                  setKardexCurrentPage(1);
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
                value={kardexSucursal}
                onChange={(e) => {
                  setKardexSucursal(e.target.value);
                  setKardexCurrentPage(1);
                }}
                title="Filtrar por sucursal"
              >
                <option value="ALL">SUCURSAL</option>
                <option value="PRINCIPAL">SEDE PRINCIPAL - SAN MIGUEL</option>
                <option value="SUCURSAL_2">SUCURSAL 2 - JESÚS MARÍA</option>
              </select>

              <select
                className="inv-select-producto"
                value={kardexProductoId}
                onChange={(e) => {
                  setKardexProductoId(e.target.value);
                  setKardexCurrentPage(1);
                }}
                title="Buscar producto"
              >
                <option value="ALL">BUSCAR EL PRODUCTO</option>
                {productos.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Barra de herramientas flotante centrada: [PDF] [EXCEL] [CONFIG] */}
          <div className="inv-export-toolbar">
            <button
              type="button"
              className="btn-export btn-export-pdf"
              onClick={() => window.print()}
              title="Exportar a PDF / Imprimir Kardex"
            >
              <FileText size={15} />
            </button>
            <button
              type="button"
              className="btn-export btn-export-excel"
              onClick={() => {
                const csv = 'data:text/csv;charset=utf-8,\uFEFF' +
                  ['FECHA,MOVIMIENTO,INV. INICIAL,ENTRADA,SALIDA,INV. FINAL', ...kardexCalculated.map((m) => `"${m.fecha}","${m.movimiento}",${m.invInicial},${m.entrada},${m.salida},${m.invFinal}`)].join('\n');
                const link = document.createElement('a');
                link.href = encodeURI(csv);
                link.download = `kardex_${Date.now()}.csv`;
                link.click();
              }}
              title="Descargar Tarjeta Kardex en Excel (.CSV)"
            >
              <FileSpreadsheet size={15} />
            </button>
            <button
              type="button"
              className="btn-export btn-export-config"
              onClick={() => {
                setKardexProductoId('ALL');
                setKardexSucursal('ALL');
                showNotif('Filtros de Kardex restaurados.');
              }}
              title="Restablecer filtros"
            >
              <Settings size={15} />
            </button>
          </div>

          {/* TABLA TARJETA KARDEX (Screenshot 3) */}
          <div className="kardex-table-wrap">
            <table className="kardex-table">
              <thead>
                <tr>
                  <th colSpan={6} className="kardex-banner-th">
                    TARJETA KARDEX
                  </th>
                </tr>
                <tr>
                  <th colSpan={2} className="kardex-split-blue">
                    FECHA Y DOCUMENTO / DESCRIPCIÓN MVTO.
                  </th>
                  <th colSpan={4} className="kardex-split-green">
                    UNIDADES
                  </th>
                </tr>
                <tr className="kardex-cols-row">
                  <th style={{ width: 140 }} className="kardex-td-center">FECHA</th>
                  <th>MOVIMIENTO</th>
                  <th style={{ width: 120 }} className="kardex-td-center">INV. INICIAL</th>
                  <th style={{ width: 110 }} className="kardex-td-center">ENTRADA</th>
                  <th style={{ width: 110 }} className="kardex-td-center">SALIDA</th>
                  <th style={{ width: 120 }} className="kardex-td-center">INV. FINAL</th>
                </tr>
              </thead>
              <tbody>
                {kardexPaginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px 14px', color: '#64748b' }}>
                      No se encontraron registros en el Kardex para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  kardexPaginated.map((row) => (
                    <tr key={row.id}>
                      <td className="kardex-td-center" style={{ color: '#475569', fontWeight: 600 }}>
                        {row.fecha}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{row.movimiento}</div>
                        <div style={{ fontSize: 10.5, color: '#64748b' }}>
                          {row.producto} · Lote: {row.lote}
                        </div>
                      </td>
                      <td className="kardex-td-center" style={{ fontWeight: 700, color: '#475569' }}>
                        {row.invInicial}
                      </td>
                      <td className="kardex-td-center">
                        {row.entrada && row.entrada > 0 ? (
                          <span className="kardex-num-entrada">+{row.entrada}</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                      <td className="kardex-td-center">
                        {row.salida && row.salida > 0 ? (
                          <span className="kardex-num-salida">-{row.salida}</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                      <td className="kardex-td-center">
                        <span className="kardex-num-final">{row.invFinal}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="inv-pagination">
            <span>
              Mostrando {kardexCalculated.length === 0 ? 0 : (kardexCurrentPage - 1) * kardexPageSize + 1} a{' '}
              {Math.min(kardexCurrentPage * kardexPageSize, kardexCalculated.length)} de {kardexCalculated.length} registros
            </span>
            <div className="inv-page-btns">
              <button
                type="button"
                className="inv-btn-nav"
                disabled={kardexCurrentPage === 1}
                onClick={() => setKardexCurrentPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>
              {Array.from({ length: Math.min(5, kardexTotalPages) }).map((_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    type="button"
                    className={`inv-btn-nav ${kardexCurrentPage === p ? 'active' : ''}`}
                    onClick={() => setKardexCurrentPage(p)}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                type="button"
                className="inv-btn-nav"
                disabled={kardexCurrentPage >= kardexTotalPages}
                onClick={() => setKardexCurrentPage((p) => Math.min(kardexTotalPages, p + 1))}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      )}

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
            <button
              type="button"
              className="btn-new-product"
              onClick={openCreateProductModal}
              title="Registrar nuevo producto en catálogo"
            >
              <Plus size={14} /> NUEVO PRODUCTO
            </button>
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
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{p.nombre}</div>
                          <span style={{ fontSize: 10, color: '#64748b' }}>
                            Mínimo sugerido: {p.stockMinimo} {p.unidadBase}s
                          </span>
                        </td>
                        <td>
                          <span className="prod-cat-badge">{p.categoriaNombre}</span>
                        </td>
                        <td className="kardex-td-center" style={{ fontWeight: 600, color: '#475569' }}>
                          {p.unidadBase}
                        </td>
                        <td className="kardex-td-right" style={{ fontWeight: 800, color: '#2563eb' }}>
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
                            onClick={() => toggleProductStatus(p)}
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
                              onClick={() => toggleProductStatus(p)}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
        <div className="inv-modal-overlay" onClick={() => setModalProductOpen(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="inv-modal-header">
              <h3 className="inv-modal-title">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto en Catálogo'}
              </h3>
              <button
                type="button"
                className="inv-modal-close"
                onClick={() => setModalProductOpen(false)}
                title="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="inv-modal-form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 12 }}>
                <div className="inv-form-group">
                  <label>Código de Barras / SKU *</label>
                  <input
                    type="text"
                    required
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value)}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                  <label>Stock Inicial / Disponible</label>
                  <input
                    type="number"
                    min="0"
                    value={formStockInicial}
                    onChange={(e) => setFormStockInicial(e.target.value)}
                  />
                </div>
              </div>

              <div className="inv-modal-footer">
                <button
                  type="button"
                  className="inv-btn-cancel"
                  onClick={() => setModalProductOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="inv-btn-submit">
                  {editingProduct ? 'Actualizar Producto' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
