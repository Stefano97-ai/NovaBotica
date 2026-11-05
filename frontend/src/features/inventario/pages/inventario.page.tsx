import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  Barcode
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

/* ================= INITIAL DEMO KARDEX MOVEMENTS ================= */
const INITIAL_MOVIMIENTOS: MovimientoItem[] = [
  {
    id: 1,
    productoId: 1,
    producto: 'Paracetamol 500mg Tabletas - Genfar',
    movimiento: 'Venta F001-65 - Cliente Juan Perez',
    tipoMovimiento: 'VENTA',
    fecha: '05/11/2026',
    cantidad: 2,
    sede: 'SEDE PRINCIPAL - SAN MIGUEL',
    lote: 'L-PAR24-01'
  },
  {
    id: 2,
    productoId: 2,
    producto: 'Amoxicilina 500mg Cápsulas - Medifarma',
    movimiento: 'Venta F001-65 - Cliente Juan Perez',
    tipoMovimiento: 'VENTA',
    fecha: '05/11/2026',
    cantidad: 1,
    sede: 'SEDE PRINCIPAL - SAN MIGUEL',
    lote: 'L-AMX24-02'
  },
  {
    id: 3,
    productoId: 3,
    producto: 'Ibuprofeno 400mg Tabletas - Farmaindustria',
    movimiento: 'Venta B001-94 - Venta Mostrador',
    tipoMovimiento: 'VENTA',
    fecha: '04/11/2026',
    cantidad: 2,
    sede: 'SEDE PRINCIPAL - SAN MIGUEL',
    lote: 'L-IBU24-05'
  },
  {
    id: 4,
    productoId: 4,
    producto: 'Azitromicina 500mg Caja x 3 - Lab Portugal',
    movimiento: 'Venta F001-64 - Clínica San Gabriel',
    tipoMovimiento: 'VENTA',
    fecha: '04/11/2026',
    cantidad: 1,
    sede: 'SEDE PRINCIPAL - SAN MIGUEL',
    lote: 'L-AZI24-08'
  },
  {
    id: 5,
    productoId: 5,
    producto: 'Alcohol Medicinal 70° 1 Litro - Alkofarma',
    movimiento: 'Venta F001-63 - Consultorio Dental',
    tipoMovimiento: 'VENTA',
    fecha: '03/11/2026',
    cantidad: 1,
    sede: 'SEDE PRINCIPAL - SAN MIGUEL',
    lote: 'L-ALC24-11'
  },
  {
    id: 6,
    productoId: 6,
    producto: 'Panadol Antigripal Tableta x 24 - GSK',
    movimiento: 'Venta F001-63 - Consultorio Dental',
    tipoMovimiento: 'VENTA',
    fecha: '03/11/2026',
    cantidad: 1,
    sede: 'SEDE PRINCIPAL - SAN MIGUEL',
    lote: 'L-PAN24-03'
  },
  {
    id: 7,
    productoId: 7,
    producto: 'Suero Fisiológico 0.9% 500ml - Braun',
    movimiento: 'Venta B001-93 (Pack de 6)',
    tipoMovimiento: 'VENTA',
    fecha: '03/11/2026',
    cantidad: 6,
    sede: 'SEDE PRINCIPAL - SAN MIGUEL',
    lote: 'L-SUE24-07'
  },
  {
    id: 8,
    productoId: 8,
    producto: 'Bismutol Suspensión 150ml - Bagó',
    movimiento: 'Venta B001-92 (Pack de 6)',
    tipoMovimiento: 'VENTA',
    fecha: '02/11/2026',
    cantidad: 6,
    sede: 'SEDE PRINCIPAL - SAN MIGUEL',
    lote: 'L-BIS24-09'
  },
  {
    id: 9,
    productoId: 9,
    producto: 'Mascarillas Quirúrgicas 3 pliegues Caja x 50',
    movimiento: 'Venta B001-90 - Paciente Ambulatorio',
    tipoMovimiento: 'VENTA',
    fecha: '02/11/2026',
    cantidad: 1,
    sede: 'SEDE PRINCIPAL - SAN MIGUEL',
    lote: 'L-MAS24-15'
  },
  {
    id: 10,
    productoId: 10,
    producto: 'Omeprazol 20mg Cápsulas - Farmaindustria',
    movimiento: 'Compra C001-12 - Ingreso Droguería Suiza',
    tipoMovimiento: 'COMPRA',
    fecha: '02/11/2026',
    cantidad: 50,
    sede: 'SEDE PRINCIPAL - SAN MIGUEL',
    lote: 'L-OMP24-20'
  },
  {
    id: 11,
    productoId: 2,
    producto: 'Amoxicilina 500mg Cápsulas - Medifarma',
    movimiento: 'Ajuste Ingreso (+20 Conteo Físico)',
    tipoMovimiento: 'AJUSTE',
    fecha: '01/11/2026',
    cantidad: 20,
    sede: 'SEDE PRINCIPAL - SAN MIGUEL',
    lote: 'L-AMX24-02'
  },
  {
    id: 12,
    productoId: 1,
    producto: 'Paracetamol 500mg Tabletas - Genfar',
    movimiento: 'Transferencia Sede San Miguel -> Sucursal 2',
    tipoMovimiento: 'TRANSFERENCIA',
    fecha: '01/11/2026',
    cantidad: 15,
    sede: 'SUCURSAL 2 - JESÚS MARÍA',
    lote: 'L-PAR24-01'
  }
];

interface InventarioPageProps {
  defaultTab?: 'kardex' | 'productos';
}

export default function InventarioPage({ defaultTab = 'kardex' }: InventarioPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSub = searchParams.get('sub');
  
  // Tab activo: 'kardex' o 'productos'
  const [activeTab, setActiveTab] = useState<'kardex' | 'productos'>(() => {
    if (urlSub === 'productos' || defaultTab === 'productos') return 'productos';
    return 'kardex';
  });

  // Notificaciones
  const [notif, setNotif] = useState<string | null>(null);

  function showNotif(msg: string) {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3500);
  }

  // Sincronizar tab con URL
  function handleTabChange(tab: 'kardex' | 'productos') {
    setActiveTab(tab);
    setSearchParams({ sub: tab });
  }

  /* =========================================================================
     ESTADOS SUBMÓDULO: KARDEX
     ========================================================================= */
  const [movimientos, setMovimientos] = useState<MovimientoItem[]>(INITIAL_MOVIMIENTOS);
  const [fechaInicio, setFechaInicio] = useState('2026-11-05');
  const [fechaFin, setFechaFin] = useState('2026-11-05');
  const [kardexPageSize, setKardexPageSize] = useState(10);
  const [kardexSucursal, setKardexSucursal] = useState('ALL');
  const [kardexProductoId, setKardexProductoId] = useState<string>('ALL');
  const [kardexCurrentPage, setKardexCurrentPage] = useState(1);

  // Modal Transferencia
  const [modalTransOpen, setModalTransOpen] = useState(false);
  const [transOrigen, setTransOrigen] = useState('Sede Principal - San Miguel');
  const [transDestino, setTransDestino] = useState('Sucursal 2 - Jesús María');
  const [transProducto, setTransProducto] = useState('Paracetamol 500mg Tabletas - Genfar');
  const [transCantidad, setTransCantidad] = useState(10);

  /* =========================================================================
     ESTADOS SUBMÓDULO: ADMINISTRAR PRODUCTOS
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

  // Cargar datos del backend si están disponibles
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
              producto: m.productoNombre || 'Medicamento',
              movimiento: m.referencia || `${m.tipo || 'MOVIMIENTO'} #${m.id}`,
              tipoMovimiento: (m.tipo as any) || 'AJUSTE',
              fecha: m.fecha ? new Date(m.fecha).toLocaleDateString('es-PE') : '05/11/2026',
              cantidad: m.cantidad || 1,
              sede: m.sede || 'SEDE PRINCIPAL - SAN MIGUEL',
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
     CÁLCULO MATEMÁTICO SECUENCIAL DE LA TARJETA KARDEX
     ========================================================================= */
  const kardexCalculated = useMemo(() => {
    // Filtrar por sucursal y producto
    let list = movimientos.filter((m) => {
      const matchSucursal =
        kardexSucursal === 'ALL' ||
        (kardexSucursal === 'PRINCIPAL' && m.sede.includes('PRINCIPAL')) ||
        (kardexSucursal === 'SUCURSAL_2' && m.sede.includes('SUCURSAL 2'));

      const matchProducto =
        kardexProductoId === 'ALL' ||
        m.productoId === Number(kardexProductoId) ||
        m.producto.toLowerCase().includes(kardexProductoId.toLowerCase());

      return matchSucursal && matchProducto;
    });

    // Calcular saldos continuos
    let balance = 100; // Base inicial de inventario para cálculo continuo
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

  // Paginación Kardex
  const kardexTotalPages = Math.ceil(kardexCalculated.length / kardexPageSize) || 1;
  const kardexPaginated = useMemo(() => {
    const start = (kardexCurrentPage - 1) * kardexPageSize;
    return kardexCalculated.slice(start, start + kardexPageSize);
  }, [kardexCalculated, kardexCurrentPage, kardexPageSize]);

  /* =========================================================================
     FILTRADO Y PAGINACIÓN DE PRODUCTOS
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

  // KPIs de Productos
  const kpiTotal = productos.length;
  const kpiEnStock = productos.filter((p) => p.stockDisponible > 0).length;
  const kpiBajoStock = productos.filter((p) => p.stockDisponible <= p.stockMinimo).length;
  const kpiCategorias = categorias.length;

  /* =========================================================================
     ACCIONES KARDEX: Exportar, reset
     ========================================================================= */
  function exportKardexExcel() {
    const headers = ['FECHA', 'MOVIMIENTO', 'INV. INICIAL', 'ENTRADA', 'SALIDA', 'INV. FINAL', 'SUCURSAL', 'LOTE'];
    const rows = kardexCalculated.map((m) => [
      `"${m.fecha}"`,
      `"${m.movimiento}"`,
      m.invInicial,
      m.entrada,
      m.salida,
      m.invFinal,
      `"${m.sede}"`,
      `"${m.lote}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tarjeta_kardex_novasalud_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotif('Tarjeta Kardex exportada en formato Excel (.CSV).');
  }

  function exportKardexPdf() {
    window.print();
  }

  function resetKardexFilters() {
    setFechaInicio('2026-11-05');
    setFechaFin('2026-11-05');
    setKardexSucursal('ALL');
    setKardexProductoId('ALL');
    setKardexCurrentPage(1);
    showNotif('Filtros de Kardex restaurados correctamente.');
  }

  /* =========================================================================
     ACCIONES PRODUCTOS: Crear, editar, cambiar estado, ir a kardex
     ========================================================================= */
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

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!formNombre.trim()) {
      alert('Ingresa el nombre del producto.');
      return;
    }

    const catObj = categorias.find((c) => c.id === Number(formCategoriaId));
    const catName = catObj ? catObj.nombre : 'General';

    if (editingProduct) {
      // Editar
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

      try {
        await fetch(`/api/productos/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            codigo: updated.codigo,
            nombre: updated.nombre,
            categoriaId: updated.categoriaId,
            unidadBase: updated.unidadBase,
            precioVenta: updated.precioVenta,
            stockMinimo: updated.stockMinimo
          })
        });
      } catch {
        // Fallback local
      }

      setProductos((prev) => prev.map((p) => (p.id === editingProduct.id ? updated : p)));
      setModalProductOpen(false);
      showNotif(`Producto "${updated.nombre}" actualizado exitosamente.`);
    } else {
      // Crear nuevo
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

      try {
        const res = await fetch('/api/productos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            codigo: nuevo.codigo,
            nombre: nuevo.nombre,
            categoriaId: nuevo.categoriaId,
            unidadBase: nuevo.unidadBase,
            precioVenta: nuevo.precioVenta,
            stockMinimo: nuevo.stockMinimo
          })
        });
        if (res.ok) {
          const data = await res.json();
          nuevo.id = data.id || nuevo.id;
        }
      } catch {
        // Fallback local
      }

      setProductos((prev) => [nuevo, ...prev]);
      setModalProductOpen(false);
      showNotif(`Producto "${nuevo.nombre}" registrado exitosamente.`);
    }
  }

  async function toggleProductStatus(p: ProductoItem) {
    const nextStatus = !p.activo;
    try {
      await fetch(`/api/productos/${p.id}/activo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: nextStatus })
      });
    } catch {
      // Fallback local
    }
    setProductos((prev) => prev.map((item) => (item.id === p.id ? { ...item, activo: nextStatus } : item)));
    showNotif(`Producto "${p.nombre}" marcado como ${nextStatus ? 'ACTIVO' : 'INACTIVO'}.`);
  }

  // Ver kardex de un producto específico directamente desde la tabla de productos
  function verKardexDeProducto(p: ProductoItem) {
    setKardexProductoId(String(p.id));
    setActiveTab('kardex');
    setSearchParams({ sub: 'kardex', productoId: String(p.id) });
    showNotif(`Visualizando Tarjeta Kardex de: ${p.nombre}`);
  }

  // Guardar transferencia directa entre sedes
  function handleGuardarTransferencia(e: React.FormEvent) {
    e.preventDefault();
    const nuevoMov: MovimientoItem = {
      id: Date.now(),
      producto: transProducto,
      movimiento: `Transferencia ${transOrigen.split('-')[0].trim()} -> ${transDestino.split('-')[0].trim()}`,
      tipoMovimiento: 'TRANSFERENCIA',
      fecha: new Date().toLocaleDateString('es-PE'),
      cantidad: transCantidad,
      sede: 'SEDE PRINCIPAL - SAN MIGUEL',
      lote: 'L-PAR24-01'
    };

    setMovimientos((prev) => [nuevoMov, ...prev]);
    setModalTransOpen(false);
    showNotif(`Transferencia de ${transCantidad} unidades enviada a ${transDestino}.`);
  }

  return (
    <div className="inv-page">
      {/* ================= 1. SUBHEADER BAR OSCURA ================= */}
      <div className="inv-bar">
        <h1 className="inv-bar-title">
          {activeTab === 'kardex' ? (
            <>
              <ClipboardList size={15} strokeWidth={2.2} /> KARDEX
            </>
          ) : (
            <>
              <Boxes size={15} strokeWidth={2.2} /> PRODUCTOS
            </>
          )}
        </h1>
        <div className="inv-actions">
          {activeTab === 'kardex' ? (
            <>
              <Link to="/ventas?tipo=FACTURA" className="inv-dash-btn" title="Emitir Factura Electrónica">
                <FileText size={12} strokeWidth={2} /> EMITIR FACTURA
              </Link>
              <Link to="/ventas?tipo=BOLETA" className="inv-dash-btn" title="Emitir Boleta de Venta">
                <Receipt size={12} strokeWidth={2} /> EMITIR BOLETA
              </Link>
              <Link to="/ventas?tipo=NOTA_VENTA" className="inv-dash-btn" title="Emitir Nota de Venta">
                <ClipboardList size={12} strokeWidth={2} /> NOTA DE VENTA
              </Link>
            </>
          ) : (
            <button
              type="button"
              className="btn-new-product"
              onClick={openCreateProductModal}
              title="Registrar nuevo producto en catálogo"
            >
              <Plus size={14} /> NUEVO PRODUCTO
            </button>
          )}
        </div>
      </div>

      {/* ================= 2. PESTAÑAS SELECTORAS DE SUBMÓDULO ================= */}
      <div className="inv-tabs-container">
        <button
          type="button"
          className={`inv-submod-tab ${activeTab === 'kardex' ? 'is-active' : ''}`}
          onClick={() => handleTabChange('kardex')}
          title="Ver Tarjeta Kardex y movimientos de existencias"
        >
          <ClipboardList size={14} /> TARJETA KARDEX
        </button>
        <button
          type="button"
          className={`inv-submod-tab ${activeTab === 'productos' ? 'is-active' : ''}`}
          onClick={() => handleTabChange('productos')}
          title="Administrar catálogo de productos, precios y stock"
        >
          <Boxes size={14} /> ADMINISTRAR PRODUCTOS
        </button>
      </div>

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

      {/* ================= 3. CONTENIDO: SUBMÓDULO KARDEX ================= */}
      {activeTab === 'kardex' && (
        <div className="inv-card">
          {/* Header Row: Title + Transferencia */}
          <div className="inv-header-row">
            <h2 className="inv-title">ADMINISTRACIÓN DE KARDEX</h2>
            <div className="inv-top-buttons">
              <button
                type="button"
                className="btn-transfer"
                onClick={() => setModalTransOpen(true)}
                title="Realizar transferencia directa entre sedes"
              >
                <ArrowLeftRight size={13} /> Transferencia Directa
              </button>
            </div>
          </div>

          {/* Filtros superiores idénticos a la captura de referencia */}
          <div className="inv-filters-grid">
            {/* Fila 1: Dos selectores de fecha */}
            <div className="inv-date-row">
              <div className="inv-date-box" title="Fecha inicio">
                <Calendar size={15} color="#475569" />
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  aria-label="Fecha inicio"
                />
              </div>
              <div className="inv-date-box" title="Fecha fin">
                <Calendar size={15} color="#475569" />
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
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
                aria-label="Registros por página"
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
                aria-label="Filtrar por sucursal"
              >
                <option value="ALL">SUCURSAL (TODAS)</option>
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
                title="Filtrar kardex por producto"
                aria-label="Filtrar kardex por producto"
              >
                <option value="ALL">BUSCAR EL PRODUCTO (TODOS LOS PRODUCTOS)</option>
                {productos.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    [{prod.codigo}] {prod.nombre} ({prod.categoriaNombre})
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
              onClick={exportKardexPdf}
              title="Exportar a PDF / Imprimir Kardex"
            >
              <FileText size={15} />
            </button>
            <button
              type="button"
              className="btn-export btn-export-excel"
              onClick={exportKardexExcel}
              title="Descargar Tarjeta Kardex en Excel (.CSV)"
            >
              <FileSpreadsheet size={15} />
            </button>
            <button
              type="button"
              className="btn-export btn-export-config"
              onClick={resetKardexFilters}
              title="Restablecer filtros de búsqueda"
            >
              <Settings size={15} />
            </button>
          </div>

          {/* TABLA TARJETA KARDEX (Exactamente como en la captura del usuario) */}
          <div className="kardex-table-wrap">
            <table className="kardex-table">
              <thead>
                {/* 1. Banner azul superior: TARJETA KARDEX */}
                <tr>
                  <th colSpan={6} className="kardex-banner-th">
                    TARJETA KARDEX
                  </th>
                </tr>

                {/* 2. Sub-bloques: Azul (Fecha/Movimiento) y Verde (Unidades) */}
                <tr>
                  <th colSpan={2} className="kardex-split-blue">
                    FECHA Y DOCUMENTO / DESCRIPCIÓN MVTO.
                  </th>
                  <th colSpan={4} className="kardex-split-green">
                    UNIDADES
                  </th>
                </tr>

                {/* 3. Encabezados de columnas individuales */}
                <tr className="kardex-cols-row">
                  <th style={{ width: 130 }} className="kardex-td-center">FECHA</th>
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
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>
                          {row.movimiento}
                        </div>
                        <div style={{ fontSize: 10.5, color: '#64748b' }}>
                          {row.producto} · Lote: {row.lote} · {row.sede}
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

          {/* Paginación Kardex */}
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
                Anterior
              </button>
              {Array.from({ length: kardexTotalPages }).map((_, i) => {
                const p = i + 1;
                if (kardexTotalPages > 6 && Math.abs(kardexCurrentPage - p) > 2 && p !== 1 && p !== kardexTotalPages) {
                  return null;
                }
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
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 4. CONTENIDO: SUBMÓDULO PRODUCTOS ================= */}
      {activeTab === 'productos' && (
        <div className="inv-card">
          {/* Header Row: Title + New Product */}
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

          {/* KPI Ribbon de Productos */}
          <div className="prod-kpi-ribbon">
            <div className="prod-kpi-card">
              <div className="prod-kpi-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                <Package size={22} />
              </div>
              <div className="prod-kpi-info">
                <span className="prod-kpi-val">{kpiTotal}</span>
                <span className="prod-kpi-label">Total Productos</span>
              </div>
            </div>

            <div className="prod-kpi-card">
              <div className="prod-kpi-icon" style={{ background: '#dcfce7', color: '#15803d' }}>
                <CheckCircle2 size={22} />
              </div>
              <div className="prod-kpi-info">
                <span className="prod-kpi-val">{kpiEnStock}</span>
                <span className="prod-kpi-label">Con Existencias</span>
              </div>
            </div>

            <div className="prod-kpi-card">
              <div className="prod-kpi-icon" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                <TrendingDown size={22} />
              </div>
              <div className="prod-kpi-info">
                <span className="prod-kpi-val">{kpiBajoStock}</span>
                <span className="prod-kpi-label">Stock Crítico (≤ Mín)</span>
              </div>
            </div>

            <div className="prod-kpi-card">
              <div className="prod-kpi-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
                <Layers size={22} />
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
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              type="button"
                              className="prod-btn-action"
                              onClick={() => openEditProductModal(p)}
                              title="Editar producto"
                            >
                              <PenSquare size={13} />
                            </button>
                            <button
                              type="button"
                              className="prod-btn-action prod-btn-action-kardex"
                              onClick={() => verKardexDeProducto(p)}
                              title="Ver Tarjeta Kardex de este producto"
                            >
                              <ClipboardList size={13} />
                            </button>
                            <button
                              type="button"
                              className="prod-btn-action"
                              onClick={() => toggleProductStatus(p)}
                              title={p.activo ? 'Desactivar producto' : 'Activar producto'}
                            >
                              <Power size={13} color={p.activo ? '#dc2626' : '#16a34a'} />
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

          {/* Paginación Productos */}
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
                Anterior
              </button>
              {Array.from({ length: prodTotalPages }).map((_, i) => {
                const p = i + 1;
                if (prodTotalPages > 6 && Math.abs(prodCurrentPage - p) > 2 && p !== 1 && p !== prodTotalPages) {
                  return null;
                }
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
                Siguiente
              </button>
            </div>
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
                  <option value="Sede Principal - San Miguel">Sede Principal - San Miguel</option>
                  <option value="Sucursal 2 - Jesús María">Sucursal 2 - Jesús María</option>
                </select>
              </div>

              <div className="inv-form-group">
                <label>Sede Destino</label>
                <select value={transDestino} onChange={(e) => setTransDestino(e.target.value)}>
                  <option value="Sucursal 2 - Jesús María">Sucursal 2 - Jesús María</option>
                  <option value="Sede Principal - San Miguel">Sede Principal - San Miguel</option>
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
    </div>
  );
}
