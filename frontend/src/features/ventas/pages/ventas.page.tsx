import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaHouse,
  FaFloppyDisk,
  FaTrashCan,
  FaCreditCard,
  FaMagnifyingGlass,
  FaCamera,
  FaPenToSquare,
  FaUserTie,
  FaLaptop,
  FaComputer,
  FaComputerMouse,
  FaHardDrive,
  FaCartShopping,
  FaPrint
} from 'react-icons/fa6';
import { X, CheckCircle2, ListChecks } from 'lucide-react';
import { calculateSaleTotals } from '../domain/sale-totals';
import { PaymentRows } from '../presentation/components/payment-rows';
import { SerialPicker } from '../presentation/components/serial-picker';
import { paymentError, paidCents, syncPaymentTotal, type PaymentRow } from '../domain/payment';
import type { AvailableSerial } from '../domain/series';
import { loadSerials, resolveCustomer, salesRequest, type SaleCustomer } from '../infrastructure/sales-api';
import './ventas.css';

interface ProductItem {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  unidad: string;
  requiereSerie: boolean;
  iconType: 'avatar' | 'laptop' | 'computer' | 'mouse' | 'ssd' | 'camera' | 'printer';
}

interface CartItem {
  productoId: number;
  codigo: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  requiereSerie: boolean;
  series: AvailableSerial[];
}

export default function VentasPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('tipo');

  // 1-second loading screen every time POS is opened
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Document Type: FACTURA | BOLETA
  const [docType, setDocType] = useState<'FACTURA' | 'BOLETA'>(() => {
    if (initialType === 'FACTURA') return 'FACTURA';
    return 'BOLETA';
  });

  // Products and Categories
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<string[]>(['Todas las categorías']);
  const [selectedCategory, setSelectedCategory] = useState('Todas las categorías');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState('20');

  // Quantities selected per card
  const [cardQuantities, setCardQuantities] = useState<Record<number, number>>({});

  // Client form
  const [clientDocType, setClientDocType] = useState(() => (initialType === 'FACTURA' ? 'RUC' : 'SIN DOCUMENTO'));
  const [clientDocNumber, setClientDocNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientDetails, setClientDetails] = useState('-');
  const [clientPhone, setClientPhone] = useState('');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Payments are allocated amounts; cash tender/change is a separate calculator.
  const newPayment = (): PaymentRow => ({ id: crypto.randomUUID(), metodo: 'Efectivo', monto: '0.00', referencia: '' });
  const [payments, setPayments] = useState<PaymentRow[]>(() => [newPayment()]);
  const [showVueltoModal, setShowVueltoModal] = useState(false);
  const [pagaCon, setPagaCon] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const requestRef = useRef<{ signature: string; key: string } | null>(null);
  const [saleError, setSaleError] = useState('');
  const [catalogError, setCatalogError] = useState('');
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [serialProductId, setSerialProductId] = useState<number | null>(null);
  const serialItem = cart.find(item => item.productoId === serialProductId);

  // Modals / Feedback
  const [successSale, setSuccessSale] = useState<{ id: string; total: number; docType: string; pagos: { metodo: string; monto: number }[] } | null>(null);

  // Load backend products and categories if available
  useEffect(() => {
    async function loadBackendData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/productos?soloActivos=true'),
          fetch('/api/categorias?soloActivas=true'),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          if (Array.isArray(catData) && catData.length > 0) {
            const catNames = catData.map((c: { nombre: string }) => c.nombre);
            setCategories(['Todas las categorías', ...catNames]);
          }
        }

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          if (Array.isArray(prodData)) {
            const mapped: ProductItem[] = prodData.map((p: {
              id: number;
              codigo: string;
              nombre: string;
              categoriaNombre?: string;
              precioVenta: number;
              stockDisponible?: number;
              unidadBase?: string;
              requiereSerie?: boolean;
            }) => ({
              id: p.id,
              codigo: p.codigo,
              nombre: p.nombre,
              categoria: p.categoriaNombre || 'General',
              precio: Number(p.precioVenta) || 0,
              stock: Number(p.stockDisponible) || 0,
              unidad: p.unidadBase || 'UNIDAD',
              requiereSerie: Boolean(p.requiereSerie),
              iconType: (p.nombre.toLowerCase().includes('laptop')
                ? 'laptop'
                : p.nombre.toLowerCase().includes('mouse')
                ? 'mouse'
                : p.nombre.toLowerCase().includes('ssd') || p.nombre.toLowerCase().includes('disco')
                ? 'ssd'
                : p.nombre.toLowerCase().includes('impresora')
                ? 'printer'
                : 'computer') as ProductItem['iconType'],
            }));
            setProducts(mapped);
          }
        }
        if (!prodRes.ok) throw new Error('No se pudo cargar el catálogo.');
        setCatalogError('');
      } catch {
        setCatalogError('No pudimos cargar el catálogo. Vuelve a actualizarlo antes de vender.');
      }
    }
    loadBackendData();
  }, [catalogVersion]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'Todas las categorías' || p.categoria === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.codigo.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Card quantity helper
  function getQty(id: number) {
    return cardQuantities[id] ?? 1;
  }

  function changeCardQty(id: number, delta: number) {
    setCardQuantities((prev) => {
      const current = prev[id] ?? 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [id]: next };
    });
  }

  // Add to Cart
  function addToCart(p: ProductItem, qtyToAdd?: number) {
    if (savingRef.current) return;
    const qty = qtyToAdd ?? getQty(p.id);
    const existing = cart.find(item => item.productoId === p.id)?.cantidad ?? 0;
    if (qty + existing > p.stock) { setSaleError('La cantidad supera el stock disponible de este producto.'); return; }
    setSaleError('');
    setCart((prev) => {
      const index = prev.findIndex((item) => item.productoId === p.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          cantidad: updated[index].cantidad + qty,
        };
        return updated;
      }
      return [
        ...prev,
        {
          productoId: p.id,
          codigo: p.codigo,
          nombre: p.nombre,
          precioUnitario: p.precio,
          cantidad: qty,
          requiereSerie: p.requiereSerie,
          series: [],
        },
      ];
    });
  }

  // Remove from cart
  function removeFromCart(productoId: number) {
    setCart((prev) => prev.filter((item) => item.productoId !== productoId));
  }

  const { subtotal, igv, total } = useMemo(() => calculateSaleTotals(cart), [cart]);

  // Default payment amount to total
  useEffect(() => {
    setPayments(previous => syncPaymentTotal(previous, total));
  }, [total]);

  function resetCustomer() {
    setClientDocNumber(''); setClientName(''); setClientDetails(''); setClientPhone(''); setSaleError('');
  }
  function handleDocTypeChange(type: 'FACTURA' | 'BOLETA') {
    setDocType(type); setClientDocType(type === 'FACTURA' ? 'RUC' : 'SIN DOCUMENTO'); resetCustomer();
  }
  async function searchClient() {
    if (!clientDocNumber.trim() || clientDocType === 'SIN DOCUMENTO') return;
    try {
      const customer = await salesRequest<SaleCustomer>(`/clientes/buscar?tipo=${encodeURIComponent(clientDocType)}&numero=${encodeURIComponent(clientDocNumber.trim())}`);
      setClientName(customer.nombre); setClientDetails(customer.direccion ?? ''); setClientPhone(customer.telefono ?? ''); setSaleError('');
    } catch (error) { setSaleError(error instanceof Error ? error.message : 'No se pudo buscar al cliente.'); }
  }
  async function emitSale() {
    if (savingRef.current) return;
    setSaleError('');
    if (!cart.length) { setSaleError('Agrega al menos un producto al comprobante.'); return; }
    const invalidPayment = paymentError(payments, total);
    if (invalidPayment) { setSaleError(invalidPayment); return; }
    if (clientDocType !== 'SIN DOCUMENTO') {
      const pattern = clientDocType === 'RUC' ? /^\d{11}$/ : clientDocType === 'DNI' ? /^\d{8}$/ : /^[A-Za-z0-9]{6,11}$/;
      if (!pattern.test(clientDocNumber.trim()) || clientName.trim().length < 2) {
        setSaleError('Completa el número de documento y el nombre del cliente, o búscalo con la lupa.'); return;
      }
    }
    savingRef.current = true; setSaving(true);
    try {
      const customer = await resolveCustomer(clientDocType, clientDocNumber, clientName, clientDetails, clientPhone);
      const payload = {
        clienteId: customer?.id ?? null, tipoComprobante: docType,
        items: cart.map(item => ({ productoId: item.productoId, cantidad: item.cantidad,
          precioUnitario: item.precioUnitario, unidadesSerializadas: item.series.map(unit => unit.id) })),
        pagos: payments.map(row => ({ metodo: row.metodo, monto: Number(row.monto), referencia: row.referencia.trim() || null })),
      };
      const signature = JSON.stringify(payload);
      if (requestRef.current?.signature !== signature) requestRef.current = { signature, key: crypto.randomUUID() };
      const result = await salesRequest<{ id: number; total: number }>('/ventas', { ...payload, claveIdempotencia: requestRef.current.key });
      setSuccessSale({ id: String(result.id), total: Number(result.total), docType, pagos: payload.pagos });
      setCart([]); setPayments([newPayment()]); requestRef.current = null; setCatalogVersion(v => v + 1);
    } catch (error) {
      setSaleError(error instanceof Error ? error.message : 'No pudimos confirmar la venta. Conservamos el comprobante para reintentar.');
    } finally { savingRef.current = false; setSaving(false); }
  }
  function clearCart() {
    if (savingRef.current || (cart.length > 0 && !confirm('¿Estás seguro de vaciar el comprobante?'))) return;
    setCart([]); setPayments([newPayment()]); setSaleError(''); requestRef.current = null;
  }

  // Vuelto calculation
  const pagaConNum = parseFloat(pagaCon) || 0;
  const cashDue = paidCents(payments.filter(row => row.metodo === 'Efectivo')) / 100;
  const vuelto = Math.max(0, pagaConNum - cashDue);

  // Render product visual / icon with high fidelity
  function renderIcon(type: ProductItem['iconType'], id?: number) {
    if (type === 'avatar' || id === 1) {
      return (
        <div
          className="pos-card-avatar"
          style={{
            background: '#86efac',
            width: 82,
            height: 82,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(134, 239, 172, 0.4)',
          }}
        >
          <svg width="60" height="60" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="22" r="11" fill="#facc15" />
            <path d="M22 20c0-6 4-11 10-11s10 5 10 11c-3-2-6-3-10-3s-7 1-10 3z" fill="#334155" />
            <path d="M14 56c0-10 8-18 18-18s18 8 18 18z" fill="#1e293b" />
            <path d="M28 38l4 9 4-9z" fill="#ffffff" />
            <path d="M30.5 40l1.5 12 1.5-12-1.5-2z" fill="#ef4444" />
          </svg>
        </div>
      );
    }

    if (id === 2) {
      // Dell Inspiron Gaming Laptop (Black with fiery red/dark screen wallpaper)
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: 84,
              height: 54,
              background: '#0f172a',
              borderRadius: '4px 4px 1px 1px',
              border: '2px solid #1e293b',
              padding: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #7f1d1d 0%, #1e1b4b 60%, #dc2626 100%)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)' }} />
            </div>
          </div>
          <div
            style={{
              width: 96,
              height: 5,
              background: 'linear-gradient(180deg, #475569 0%, #1e293b 100%)',
              borderRadius: '1px 1px 4px 4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
            }}
          />
        </div>
      );
    }

    if (id === 3 || type === 'computer') {
      // Dell Vostro Silver Laptop / PC (Silver body with sunset screen)
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: 86,
              height: 55,
              background: '#334155',
              borderRadius: '4px 4px 1px 1px',
              border: '2px solid #475569',
              padding: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #d97706 0%, #9333ea 50%, #2563eb 100%)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
            </div>
          </div>
          <div
            style={{
              width: 98,
              height: 6,
              background: 'linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%)',
              borderRadius: '1px 1px 4px 4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          />
        </div>
      );
    }

    if (id === 4 || type === 'laptop') {
      // Lenovo Blue Laptop (Blue body with Windows 11 bloom wallpaper)
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: 86,
              height: 56,
              background: '#1e3a8a',
              borderRadius: '4px 4px 1px 1px',
              border: '2px solid #1d4ed8',
              padding: 2,
              boxShadow: '0 2px 8px rgba(30, 58, 138, 0.3)',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 50%, #1e40af 100%)',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Windows 11 Bloom logo */}
              <div
                style={{
                  width: 14,
                  height: 14,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 1.5,
                  padding: 1,
                }}
              >
                <div style={{ background: '#ffffff', borderRadius: 0.5 }} />
                <div style={{ background: '#ffffff', borderRadius: 0.5 }} />
                <div style={{ background: '#ffffff', borderRadius: 0.5 }} />
                <div style={{ background: '#ffffff', borderRadius: 0.5 }} />
              </div>
            </div>
          </div>
          <div
            style={{
              width: 100,
              height: 6,
              background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
              borderRadius: '1px 1px 4px 4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
            }}
          />
        </div>
      );
    }

    if (type === 'mouse' || id === 5) {
      // Gaming Mouse RGB
      return (
        <div
          style={{
            position: 'relative',
            width: 48,
            height: 76,
            background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '24px 24px 20px 20px',
            border: '2px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
          }}
        >
          {/* Scroll wheel */}
          <div style={{ width: 5, height: 16, background: '#f59e0b', borderRadius: 2, marginTop: 8 }} />
          {/* RGB body contour */}
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              width: 32,
              height: 2.5,
              background: 'linear-gradient(90deg, #ef4444 0%, #10b981 50%, #3b82f6 100%)',
              borderRadius: 2,
              boxShadow: '0 0 6px rgba(16, 185, 129, 0.6)',
            }}
          />
        </div>
      );
    }

    if (type === 'ssd' || id === 6) {
      // Kingston A400 SSD 960GB
      return (
        <div
          style={{
            width: 78,
            height: 62,
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: 5,
            border: '1.5px solid #475569',
            padding: '6px 8px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 3px 8px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#ef4444', letterSpacing: '0.02em' }}>Kingston</span>
            <span style={{ fontSize: 8, fontWeight: 800, color: '#94a3b8' }}>A400</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#ffffff', textAlign: 'center', letterSpacing: '0.04em' }}>
            960GB SSD
          </div>
          <div style={{ height: 3, background: '#334155', borderRadius: 1.5 }} />
        </div>
      );
    }

    if (type === 'camera' || id === 7) {
      // Camera crossed with slash ("No Image" placeholder)
      return (
        <div
          style={{
            position: 'relative',
            width: 76,
            height: 76,
            borderRadius: '50%',
            border: '2.5px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FaCamera size={38} color="#1e293b" />
          <div
            style={{
              position: 'absolute',
              width: '88px',
              height: '2.5px',
              background: '#1e293b',
              transform: 'rotate(-45deg)',
            }}
          />
        </div>
      );
    }

    // Default: Epson Printer
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            width: 36,
            height: 18,
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: '2px 2px 0 0',
            borderBottom: 'none',
          }}
        />
        <div
          style={{
            width: 84,
            height: 42,
            background: '#1e293b',
            borderRadius: 4,
            border: '1.5px solid #334155',
            padding: 5,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: 7, fontWeight: 800, color: '#94a3b8' }}>EPSON</span>
          </div>
          <div style={{ width: '100%', height: 4, background: '#0f172a', borderRadius: 1 }} />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pos-loading-screen" role="status" aria-live="polite">
        <div className="pos-spinner" />
        <span className="pos-loading-text">CARGANDO POS...</span>
      </div>
    );
  }

  return (
    <div className="pos-fullscreen-page">
      {/* ================= 1. POS TOPBAR ================= */}
      <header className="pos-topbar">
        <div className="pos-top-left">
          <button className="pos-home-btn" title="Volver al menú principal" onClick={() => navigate('/')}>
            <FaHouse size={16} />
          </button>
        </div>

        {/* Central Pills: FACTURA | BOLETA */}
        <div className="doc-type-pillbox">
          <button
            type="button"
            className={`doc-pill-btn ${docType === 'FACTURA' ? 'is-active' : ''}`}
            disabled={saving}
            aria-pressed={docType === 'FACTURA'}
            onClick={() => handleDocTypeChange('FACTURA')}
          >
            FACTURA
          </button>
          <button
            type="button"
            className={`doc-pill-btn ${docType === 'BOLETA' ? 'is-active' : ''}`}
            disabled={saving}
            aria-pressed={docType === 'BOLETA'}
            onClick={() => handleDocTypeChange('BOLETA')}
          >
            BOLETA
          </button>
        </div>

      </header>

      {/* ================= 2. POS BODY ================= */}
      <div className="pos-body">
        {/* ================= LEFT COLUMN: CATALOG ================= */}
        <section className="pos-catalog-pane">
          {/* Filter Bar */}
          <div className="pos-filter-bar">
            <div className="pos-select-wrap">
              <select
                className="pos-select"
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value)}
                aria-label="Cantidad de productos por página"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>

            <div className="pos-select-wrap">
              <select
                className="pos-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filtrar por categoría"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="pos-search-wrap">
              <FaMagnifyingGlass className="pos-search-icon" size={13} />
              <input
                type="text"
                className="pos-search-input"
                placeholder="Buscar producto o servicio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {catalogError && <div role="alert" className="pos-sale-error">{catalogError}<button type="button" onClick={() => setCatalogVersion(v => v + 1)}>Reintentar</button></div>}
          {/* Product Cards Grid */}
          <div className="pos-cards-grid">
            {filteredProducts.map((p) => {
              const qty = getQty(p.id);
              const isLowStock = p.stock <= 20;

              return (
                <div key={p.id} className="pos-card">
                  {/* Stock tag / banner */}
                  {isLowStock ? (
                    <div className="pos-card-stock-top">STOCK: {p.stock}</div>
                  ) : (
                    <div className="pos-card-stock-tag">STOCK: {p.stock}</div>
                  )}

                  {/* Product visual con botón flotante al pasar el mouse */}
                  <div
                    className="pos-card-img-wrap"
                    onClick={() => addToCart(p, qty)}
                    style={{ cursor: 'pointer' }}
                  >
                    {renderIcon(p.iconType, p.id)}
                    <button
                      type="button"
                      className="pos-card-add-pill-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(p, qty);
                      }}
                      title="Agregar producto al comprobante"
                    >
                      <FaCartShopping size={11} /> AGREGAR
                    </button>
                  </div>

                  {/* Product Info */}
                  <div
                    className="pos-card-title"
                    title={p.nombre}
                    onClick={() => addToCart(p, qty)}
                    style={{ cursor: 'pointer' }}
                  >
                    {p.nombre}
                  </div>

                  <div className="pos-card-price">
                    S/ {p.precio.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>

                  {/* Quantity selector pill */}
                  <div className="pos-qty-pill">
                    <button
                      type="button"
                      className="pos-qty-btn"
                      onClick={() => changeCardQty(p.id, -1)}
                      title="Disminuir cantidad"
                    >
                      -
                    </button>
                    <span className="pos-qty-val">{qty}</span>
                    <button
                      type="button"
                      className="pos-qty-btn"
                      onClick={() => changeCardQty(p.id, 1)}
                      title="Aumentar cantidad"
                    >
                      +
                    </button>
                  </div>

                  {/* Bottom Icons (Toggle, Camera, Pencil) */}
                  <div className="pos-card-bottom">
                    <div className="pos-card-toggle" title="Estado activo"></div>
                    <div className="pos-card-actions">
                      <button type="button" className="pos-card-action-btn" title="Foto del producto">
                        <FaCamera size={13} />
                      </button>
                      <button type="button" className="pos-card-action-btn" title="Editar producto">
                        <FaPenToSquare size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= RIGHT COLUMN: CHECKOUT PANEL ================= */}
        <aside className="pos-checkout-pane" aria-label="Cliente y comprobante de venta">
          <fieldset disabled={saving} className="pos-checkout-fields">
          {/* CLIENTE Section */}
          <div className="pos-client-block">
            <h3 className="pos-section-label">CLIENTE:</h3>

            {/* Row 1: Document select + Number + Search button */}
            <div className="pos-client-row-1">
              <div className="pos-doc-select-wrap">
                <FaCreditCard className="pos-doc-icon" size={13} />
                <select
                  className="pos-doc-select"
                  aria-label="Tipo de documento del cliente"
                  disabled={docType === 'FACTURA'}
                  value={clientDocType}
                  onChange={(e) => { setClientDocType(e.target.value); resetCustomer(); }}
                >
                  {docType === 'FACTURA' ? <option value="RUC">RUC</option> : <><option value="SIN DOCUMENTO">SIN DOCUMENTO</option><option value="DNI">DNI</option><option value="CE">CARNET EXTR.</option></>}
                </select>
              </div>

              <div className="pos-doc-num-wrap">
                <input
                  type="text"
                  className="pos-doc-num-input"
                  aria-label="Número de documento del cliente"
                  disabled={clientDocType === 'SIN DOCUMENTO'}
                  maxLength={clientDocType === 'DNI' ? 8 : 11}
                  value={clientDocNumber}
                  onChange={(e) => setClientDocNumber(e.target.value)}
                  placeholder="00000000"
                />
                <button
                  type="button"
                  className="pos-doc-search-btn"
                  title="Buscar cliente en el sistema"
                  disabled={clientDocType === 'SIN DOCUMENTO'}
                  onClick={searchClient}
                >
                  <FaMagnifyingGlass size={13} />
                </button>
              </div>
            </div>

            {/* Row 2: Customer Name & Details */}
            <div className="pos-client-row-2" style={{ marginTop: 8 }}>
              <input
                type="text"
                className="pos-client-name-input"
                aria-label="Nombre o razón social del cliente"
                placeholder={clientDocType === 'SIN DOCUMENTO' ? 'CLIENTES VARIOS' : 'Nombre o razón social'}
                disabled={clientDocType === 'SIN DOCUMENTO'}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
              <input
                type="text"
                className="pos-client-extra-input" aria-label="Dirección del cliente" placeholder="Dirección"
                value={clientDetails}
                onChange={(e) => setClientDetails(e.target.value)}
              />
            </div>

            {/* Customer phone */}
            <div className="pos-client-row-3" style={{ marginTop: 8 }}>
              <div className="pos-phone-wrap">
                <span className="pos-flag-badge">🇵🇪 +51</span>
                <input
                  type="text"
                  className="pos-phone-input"
                  placeholder="Ingrese su número de celular..."
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>

            </div>
          </div>

          {/* Cart Table */}
          <div className="pos-table-wrap">
            <table className="pos-table">
              <thead>
                <tr>
                  <th>CÓDIGO</th>
                  <th>CANTIDAD</th>
                  <th>DESCRIPCIÓN</th>
                  <th>PRECIO UNITARIO</th>
                  <th>SUB.TOTAL</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="pos-table-empty">
                      No hay productos agregados al comprobante.
                    </td>
                  </tr>
                ) : (
                  cart.map((item) => (
                    <tr key={item.productoId}>
                      <td style={{ fontWeight: 600 }}>{item.codigo}</td>
                      <td>{item.cantidad}</td>
                      <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.nombre}
                      </td>
                      <td>S/ {item.precioUnitario.toFixed(2)}</td>
                      <td style={{ fontWeight: 700 }}>S/ {(item.precioUnitario * item.cantidad).toFixed(2)}</td>
                      <td className="pos-cart-item-actions">
                        {item.requiereSerie && <button type="button" className="pos-item-series-btn" title={`Series de ${item.nombre}`} aria-label={`Seleccionar series de ${item.nombre}`} onClick={() => setSerialProductId(item.productoId)}><ListChecks size={16} /><span>{item.series.length}/{item.cantidad}</span></button>}
                        <button
                          type="button"
                          className="pos-item-remove-btn"
                          title="Quitar ítem"
                          onClick={() => removeFromCart(item.productoId)}
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Sale totals: catalog prices already include IGV. */}
          <div className="pos-totals-row">
            <div className="pos-summary-list">
              <span className="pos-sum-title">RESUMEN</span>
              <div className="pos-sum-row">
                <span>SUBTOTAL</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="pos-sum-row">
                <span>IGV (18%, incluido)</span>
                <span>S/ {igv.toFixed(2)}</span>
              </div>
              <div className="pos-sum-total">
                <span>TOTAL</span>
                <span style={{ color: '#2563eb' }}>S/ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <PaymentRows rows={payments} total={total} disabled={saving}
            onChange={(id, patch) => setPayments(rows => rows.map(row => row.id === id ? { ...row, ...patch } : row))}
            onAdd={() => setPayments(rows => [...rows, { ...newPayment(), monto: (Math.max(0, Math.round(total * 100) - paidCents(rows)) / 100).toFixed(2) }])}
            onRemove={id => setPayments(rows => syncPaymentTotal(rows.filter(row => row.id !== id), total))}
            onChangeCalculator={() => setShowVueltoModal(true)} />
          {saleError && <div className="pos-sale-error" role="alert">{saleError}</div>}

          {/* Bottom Big Action Buttons (Save/Emit & Trash) */}
          <div className="pos-bottom-btns">
            <button
              type="button"
              className="pos-big-btn pos-save-btn"
              title="Emitir venta y guardar comprobante"
              onClick={emitSale}
            >
              {saving ? <span>…</span> : <FaFloppyDisk />}
            </button>
            <button
              type="button"
              className="pos-big-btn pos-clear-btn"
              title="Limpiar comprobante"
              onClick={clearCart}
            >
              <FaTrashCan />
            </button>
          </div>
          </fieldset>
        </aside>
      </div>

      {serialItem && <SerialPicker productId={serialItem.productoId} name={serialItem.nombre} quantity={serialItem.cantidad} initial={serialItem.series} load={loadSerials}
        onClose={() => setSerialProductId(null)} onSave={selected => { setCart(rows => rows.map(row => row.productoId === serialItem.productoId ? { ...row, series: selected } : row)); setSerialProductId(null); }} />}

      {/* ================= VUELTO / CAMBIO MODAL ================= */}
      {showVueltoModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowVueltoModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 12,
              padding: 24,
              width: 340,
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              color: '#1e293b',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800 }}>Calculadora de Vuelto</h3>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: '#64748b' }}>
              Efectivo a cobrar: <strong>S/ {cashDue.toFixed(2)}</strong>
            </p>

            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 4 }}>
              Cliente paga con (S/):
            </label>
            <input
              type="number"
              style={{
                width: '100%',
                height: 40,
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                padding: '0 12px',
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 12,
                outline: 'none',
              }}
              value={pagaCon}
              onChange={(e) => setPagaCon(e.target.value)}
              placeholder="0.00"
              autoFocus
            />

            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              {[10, 20, 50, 100, 200].map((billete) => (
                <button
                  key={billete}
                  type="button"
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  onClick={() => setPagaCon(String(billete))}
                >
                  S/ {billete}
                </button>
              ))}
            </div>

            <div
              style={{
                background: vuelto > 0 ? '#ecfdf5' : '#f8fafc',
                border: `1px solid ${vuelto > 0 ? '#a7f3d0' : '#e2e8f0'}`,
                borderRadius: 8,
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Vuelto a entregar:</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: vuelto > 0 ? '#059669' : '#0f172a' }}>
                S/ {vuelto.toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              style={{
                width: '100%',
                height: 38,
                background: '#5a52f3',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                cursor: 'pointer',
              }}
              onClick={() => setShowVueltoModal(false)}
            >
              Listo
            </button>
          </div>
        </div>
      )}

      {/* ================= SUCCESS SALE MODAL ================= */}
      {successSale && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 14,
              padding: 26,
              width: 380,
              textAlign: 'center',
              boxShadow: '0 15px 35px rgba(0,0,0,0.25)',
              color: '#0f172a',
            }}
          >
            <CheckCircle2 size={56} color="#10b981" style={{ margin: '0 auto 12px' }} />
            <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800 }}>¡Venta Emitida con Éxito!</h2>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: '#64748b' }}>
              Comprobante <strong>{successSale.docType} N° {successSale.id}</strong> registrado correctamente.
            </p>

            <div
              style={{
                background: '#f8fafc',
                borderRadius: 8,
                padding: 12,
                fontSize: 13,
                marginBottom: 18,
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#64748b' }}>Cliente:</span>
                <strong>{clientName || 'CLIENTES VARIOS'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#64748b' }}>Método:</span>
                <strong>{successSale.pagos.map(p => `${p.metodo}: S/ ${p.monto.toFixed(2)}`).join(' · ')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Total cobrado:</span>
                <strong style={{ color: '#2563eb' }}>S/ {successSale.total.toFixed(2)}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  height: 38,
                  background: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  window.print();
                }}
              >
                Imprimir Ticket
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  height: 38,
                  background: '#1e1b4b',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
                onClick={() => setSuccessSale(null)}
              >
                Nueva Venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
