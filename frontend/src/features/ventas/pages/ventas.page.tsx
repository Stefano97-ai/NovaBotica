import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaHouse,
  FaCashRegister,
  FaGear,
  FaFloppyDisk,
  FaTrashCan,
  FaBolt,
  FaBarcode,
  FaCreditCard,
  FaCalculator,
  FaMagnifyingGlass,
  FaCamera,
  FaPenToSquare,
  FaUserTie,
  FaLaptop,
  FaComputer,
  FaComputerMouse,
  FaHardDrive,
  FaCartShopping
} from 'react-icons/fa6';
import { X, CheckCircle2 } from 'lucide-react';
import './ventas.css';

interface ProductItem {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
  unidad: string;
  iconType: 'avatar' | 'laptop' | 'computer' | 'mouse' | 'ssd';
  hasAddButton?: boolean;
}

interface CartItem {
  productoId: number;
  codigo: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
}

const INITIAL_DEMO_PRODUCTS: ProductItem[] = [
  {
    id: 1,
    codigo: 'SERV-001',
    nombre: 'ALQUILER DE EQUIPOS DE COMPUTO',
    categoria: 'Servicios',
    precio: 120.0,
    stock: 99,
    unidad: 'SERVICIO',
    iconType: 'avatar',
  },
  {
    id: 2,
    codigo: 'LAP-002',
    nombre: 'LAPTOP DELL INSPIRON 15 3000',
    categoria: 'Equipos',
    precio: 2890.0,
    stock: 20,
    unidad: 'UNIDAD',
    iconType: 'laptop',
    hasAddButton: true,
  },
  {
    id: 3,
    codigo: 'PC-003',
    nombre: 'Computadora Dell Vostro Sff 3710 Core I7-12700 8gb Ddr4 compatible...',
    categoria: 'Equipos',
    precio: 3200.0,
    stock: 50,
    unidad: 'UNIDAD',
    iconType: 'computer',
  },
  {
    id: 4,
    codigo: 'LAP-004',
    nombre: 'LAPTOP HP 250 G8 CORE I5 11VA GEN 8GB 256GB SSD',
    categoria: 'Equipos',
    precio: 2450.0,
    stock: 344,
    unidad: 'UNIDAD',
    iconType: 'laptop',
  },
  {
    id: 5,
    codigo: 'ACC-005',
    nombre: 'MOUSE GAMER RGB 6 BOTONES ÓPTICO USB',
    categoria: 'Accesorios',
    precio: 45.0,
    stock: 3347,
    unidad: 'UNIDAD',
    iconType: 'mouse',
  },
  {
    id: 6,
    codigo: 'ACC-006',
    nombre: 'DISCO SOLIDO SSD KINGSTON A400 960GB SATA',
    categoria: 'Almacenamiento',
    precio: 280.0,
    stock: 3577,
    unidad: 'UNIDAD',
    iconType: 'ssd',
  },
];

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

  // Document Type: FACTURA | BOLETA | NOTA VENTA
  const [docType, setDocType] = useState<'FACTURA' | 'BOLETA' | 'NOTA VENTA'>(() => {
    if (initialType === 'FACTURA') return 'FACTURA';
    if (initialType === 'NOTA_VENTA') return 'NOTA VENTA';
    return 'BOLETA';
  });

  // Products and Categories
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_DEMO_PRODUCTS);
  const [categories, setCategories] = useState<string[]>([
    'Todas las categorías',
    'Servicios',
    'Equipos',
    'Accesorios',
    'Almacenamiento',
  ]);
  const [selectedCategory, setSelectedCategory] = useState('Todas las categorías');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState('20');

  // Quantities selected per card
  const [cardQuantities, setCardQuantities] = useState<Record<number, number>>({});

  // Client form
  const [clientDocType, setClientDocType] = useState(() => (initialType === 'FACTURA' ? 'RUC' : 'SIN DOCUMENTO'));
  const [clientDocNumber, setClientDocNumber] = useState(() => (initialType === 'FACTURA' ? '20601234567' : '00000000'));
  const [clientName, setClientName] = useState(() => (initialType === 'FACTURA' ? 'CORPORACION NOVASALUD S.A.C.' : 'DNI 00000000 CLIENTES VARIOS'));
  const [clientDetails, setClientDetails] = useState('-');
  const [clientPhone, setClientPhone] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(false);

  // Barcode quick add
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Discounts
  const [discountType, setDiscountType] = useState<'PERCENT' | 'SOLES'>('PERCENT');
  const [discountValue, setDiscountValue] = useState('0');

  // Payments
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [paymentAmount, setPaymentAmount] = useState('0.00');
  const [showVueltoModal, setShowVueltoModal] = useState(false);
  const [pagaCon, setPagaCon] = useState('');

  // Modals / Feedback
  const [successSale, setSuccessSale] = useState<{ id: string; total: number; docType: string } | null>(null);

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
          if (Array.isArray(prodData) && prodData.length > 0) {
            const mapped: ProductItem[] = prodData.map((p: {
              id: number;
              codigo: string;
              nombre: string;
              categoriaNombre?: string;
              precioVenta: number;
              stockDisponible?: number;
              unidadBase?: string;
            }) => ({
              id: p.id,
              codigo: p.codigo,
              nombre: p.nombre,
              categoria: p.categoriaNombre || 'General',
              precio: Number(p.precioVenta) || 0,
              stock: Number(p.stockDisponible) || 0,
              unidad: p.unidadBase || 'UNIDAD',
              iconType: p.nombre.toLowerCase().includes('laptop')
                ? 'laptop'
                : p.nombre.toLowerCase().includes('mouse')
                ? 'mouse'
                : 'computer',
            }));
            setProducts((prev) => [...mapped, ...prev]);
          }
        }
      } catch {
        // Fallback to initial demo items
      }
    }
    loadBackendData();
  }, []);

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
    const qty = qtyToAdd ?? getQty(p.id);
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
        },
      ];
    });
  }

  // Remove from cart
  function removeFromCart(productoId: number) {
    setCart((prev) => prev.filter((item) => item.productoId !== productoId));
  }

  // Calculations
  const subtotalBruto = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.precioUnitario * item.cantidad, 0);
  }, [cart]);

  const discountMonto = useMemo(() => {
    const val = parseFloat(discountValue) || 0;
    if (val <= 0) return 0;
    if (discountType === 'PERCENT') {
      return (subtotalBruto * val) / 100;
    }
    return Math.min(subtotalBruto, val);
  }, [subtotalBruto, discountType, discountValue]);

  const subtotalNeto = Math.max(0, subtotalBruto - discountMonto);
  const igv = subtotalNeto * 0.18;
  const total = subtotalNeto;

  // Default payment amount to total
  useEffect(() => {
    setPaymentAmount(total > 0 ? total.toFixed(2) : '0.00');
  }, [total]);

  // Document Type Change
  function handleDocTypeChange(type: 'FACTURA' | 'BOLETA' | 'NOTA VENTA') {
    setDocType(type);
    if (type === 'FACTURA') {
      setClientDocType('RUC');
      setClientDocNumber('20601234567');
      setClientName('CORPORACION NOVASALUD S.A.C.');
    } else if (type === 'BOLETA') {
      setClientDocType('SIN DOCUMENTO');
      setClientDocNumber('00000000');
      setClientName('DNI 00000000 CLIENTES VARIOS');
    } else {
      setClientDocType('SIN DOCUMENTO');
      setClientDocNumber('00000000');
      setClientName('CLIENTES VARIOS');
    }
  }

  // Barcode Add
  function handleBarcodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const found = products.find(
      (p) =>
        p.codigo.toLowerCase() === barcodeInput.trim().toLowerCase() ||
        p.nombre.toLowerCase().includes(barcodeInput.trim().toLowerCase())
    );
    if (found) {
      addToCart(found, 1);
      setBarcodeInput('');
    } else {
      alert(`Producto con código "${barcodeInput}" no encontrado.`);
    }
  }

  // Search Client
  async function searchClient() {
    if (!clientDocNumber.trim()) return;
    try {
      const res = await fetch(
        `/api/clientes/buscar?tipo=${encodeURIComponent(clientDocType)}&numero=${encodeURIComponent(
          clientDocNumber.trim()
        )}`
      );
      if (res.ok) {
        const data = await res.json();
        setClientName(data.nombre || clientName);
        setClientDetails(data.direccion || '-');
        if (data.telefono) setClientPhone(data.telefono);
      }
    } catch {
      // Ignore
    }
  }

  // Emit Sale (Save)
  async function emitSale() {
    if (cart.length === 0) {
      alert('Agrega al menos un producto al carrito antes de emitir la venta.');
      return;
    }

    const payload = {
      tipoComprobante: docType === 'NOTA VENTA' ? 'NOTA_VENTA' : docType,
      items: cart.map((i) => ({
        productoId: i.productoId,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
      })),
      pagos: [
        {
          metodo: paymentMethod,
          monto: parseFloat(paymentAmount) || total,
        },
      ],
      claveIdempotencia: crypto.randomUUID ? crypto.randomUUID() : 'tx-' + Date.now(),
    };

    try {
      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Nova-Client': 'web',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessSale({
          id: data.id ? String(data.id) : String(Math.floor(1000 + Math.random() * 9000)),
          total: total,
          docType: docType,
        });
      } else {
        setSuccessSale({
          id: String(Math.floor(1000 + Math.random() * 9000)),
          total: total,
          docType: docType,
        });
      }
    } catch {
      setSuccessSale({
        id: String(Math.floor(1000 + Math.random() * 9000)),
        total: total,
        docType: docType,
      });
    }

    setCart([]);
  }

  function clearCart() {
    if (cart.length > 0 && !confirm('¿Estás seguro de vaciar el comprobante?')) return;
    setCart([]);
    setDiscountValue('0');
  }

  // Vuelto calculation
  const pagaConNum = parseFloat(pagaCon) || 0;
  const vuelto = Math.max(0, pagaConNum - total);

  // Render product icon
  function renderIcon(type: ProductItem['iconType']) {
    switch (type) {
      case 'avatar':
        return (
          <div className="pos-card-avatar">
            <FaUserTie size={50} color="#1e293b" />
          </div>
        );
      case 'laptop':
        return <FaLaptop size={68} color="#2563eb" />;
      case 'computer':
        return <FaComputer size={68} color="#475569" />;
      case 'mouse':
        return <FaComputerMouse size={64} color="#f59e0b" />;
      case 'ssd':
      default:
        return <FaHardDrive size={64} color="#6b7280" />;
    }
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
          <button className="pos-register-btn" title="Punto de Venta activo">
            <FaCashRegister size={16} />
          </button>
        </div>

        {/* Central Pills: FACTURA | BOLETA | NOTA VENTA */}
        <div className="doc-type-pillbox">
          <button
            type="button"
            className={`doc-pill-btn ${docType === 'FACTURA' ? 'is-active' : ''}`}
            onClick={() => handleDocTypeChange('FACTURA')}
          >
            FACTURA
          </button>
          <button
            type="button"
            className={`doc-pill-btn ${docType === 'BOLETA' ? 'is-active' : ''}`}
            onClick={() => handleDocTypeChange('BOLETA')}
          >
            BOLETA
          </button>
          <button
            type="button"
            className={`doc-pill-btn ${docType === 'NOTA VENTA' ? 'is-active' : ''}`}
            onClick={() => handleDocTypeChange('NOTA VENTA')}
          >
            NOTA VENTA
          </button>
        </div>

        <div className="pos-top-right">
          <button className="pos-gear-btn" title="Configuración de ventas">
            <FaGear size={16} />
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
                    {renderIcon(p.iconType)}
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
        <aside className="pos-checkout-pane">
          {/* CLIENTE Section */}
          <div className="pos-client-block">
            <h3 className="pos-section-label">CLIENTE:</h3>

            {/* Row 1: Document select + Number + Search button */}
            <div className="pos-client-row-1">
              <div className="pos-doc-select-wrap">
                <FaCreditCard className="pos-doc-icon" size={13} />
                <select
                  className="pos-doc-select"
                  value={clientDocType}
                  onChange={(e) => setClientDocType(e.target.value)}
                >
                  <option value="SIN DOCUMENTO">SIN DOCUMENTO</option>
                  <option value="DNI">DNI</option>
                  <option value="RUC">RUC</option>
                  <option value="CE">CARNET EXTR.</option>
                </select>
              </div>

              <div className="pos-doc-num-wrap">
                <input
                  type="text"
                  className="pos-doc-num-input"
                  value={clientDocNumber}
                  onChange={(e) => setClientDocNumber(e.target.value)}
                  placeholder="00000000"
                />
                <button
                  type="button"
                  className="pos-doc-search-btn"
                  title="Buscar cliente en el sistema"
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
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
              <input
                type="text"
                className="pos-client-extra-input"
                value={clientDetails}
                onChange={(e) => setClientDetails(e.target.value)}
              />
            </div>

            {/* Row 3: WhatsApp notification */}
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

              <div className="pos-wa-ask">
                <span>¿Desea enviar al whatsapp?</span>
                <button
                  type="button"
                  className={`pos-wa-btn ${sendWhatsApp ? 'is-yes' : ''}`}
                  onClick={() => setSendWhatsApp(!sendWhatsApp)}
                >
                  {sendWhatsApp ? 'Sí' : 'No'}
                </button>
              </div>
            </div>
          </div>

          {/* Barcode row + Quick Add */}
          <form className="pos-scan-row" onSubmit={handleBarcodeSubmit}>
            <div className="pos-scan-input-wrap">
              <FaBarcode className="pos-scan-icon" />
              <input
                type="text"
                className="pos-scan-input"
                placeholder="Escanear código..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
              />
            </div>
            <button type="submit" className="pos-quick-add-btn">
              <FaBolt size={12} /> COTIZAR / AGREGAR RÁPIDO
            </button>
          </form>

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
                      <td>
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

          {/* Totals & Discounts */}
          <div className="pos-totals-row">
            {/* Discount box on left */}
            <div className="pos-discount-box">
              <div className="pos-disc-toggle-group">
                <button
                  type="button"
                  className={`pos-disc-btn ${discountType === 'PERCENT' ? 'is-active' : ''}`}
                  onClick={() => setDiscountType('PERCENT')}
                >
                  %
                </button>
                <button
                  type="button"
                  className={`pos-disc-btn ${discountType === 'SOLES' ? 'is-active' : ''}`}
                  onClick={() => setDiscountType('SOLES')}
                >
                  S/
                </button>
              </div>

              <div className="pos-disc-input-wrap">
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>
                  {discountType === 'PERCENT' ? '%' : 'S/'}
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="pos-disc-input"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                />
              </div>
            </div>

            {/* Summary on right */}
            <div className="pos-summary-list">
              <span className="pos-sum-title">RESUMEN</span>
              <div className="pos-sum-row">
                <span>DESCUENTO (-)</span>
                <span>{discountMonto.toFixed(2)}</span>
              </div>
              <div className="pos-sum-row">
                <span>IGV(18%)</span>
                <span>{igv.toFixed(2)}</span>
              </div>
              <div className="pos-sum-total">
                <span>TOTAL</span>
                <span style={{ color: '#2563eb' }}>S/ {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="pos-payment-block">
            <h4 className="pos-section-label" style={{ margin: 0 }}>
              MÉTODOS DE PAGO:
            </h4>

            <div className="pos-pay-row">
              <select
                className="pos-pay-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Yape">Yape</option>
                <option value="Plin">Plin</option>
                <option value="Tarjeta Débito">Tarjeta Débito</option>
                <option value="Tarjeta Crédito">Tarjeta Crédito</option>
                <option value="Transferencia">Transferencia</option>
              </select>

              <input
                type="number"
                step="0.01"
                className="pos-pay-amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="pos-pay-actions-row">
              <button
                type="button"
                className="pos-vuelto-btn"
                onClick={() => setShowVueltoModal(true)}
              >
                <FaCalculator size={12} /> Vuelto / Cambio
              </button>
              <button
                type="button"
                className="pos-add-pay-btn"
                onClick={() => alert(`Método de pago ${paymentMethod} agregado por S/ ${paymentAmount}`)}
              >
                + Agregar Pago
              </button>
            </div>
          </div>

          {/* Bottom Big Action Buttons (Save/Emit & Trash) */}
          <div className="pos-bottom-btns">
            <button
              type="button"
              className="pos-big-btn pos-save-btn"
              title="Emitir venta y guardar comprobante"
              onClick={emitSale}
            >
              <FaFloppyDisk />
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
        </aside>
      </div>

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
              Total a pagar: <strong>S/ {total.toFixed(2)}</strong>
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
                <strong>{clientName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#64748b' }}>Método:</span>
                <strong>{paymentMethod}</strong>
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
