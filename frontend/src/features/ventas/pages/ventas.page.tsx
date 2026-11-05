import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaHouse,
  FaFloppyDisk,
  FaTrashCan,
  FaCreditCard,
  FaMagnifyingGlass,
  FaCartShopping
} from 'react-icons/fa6';
import { X, CheckCircle2, ListChecks } from 'lucide-react';
import { calculateSaleTotals } from '../domain/sale-totals';
import { PaymentRows } from '../presentation/components/payment-rows';
import { SerialPicker } from '../presentation/components/serial-picker';
import { paymentError, paidCents, syncPaymentTotal, type PaymentRow } from '../domain/payment';
import type { AvailableSerial } from '../domain/series';
import { loadSerials, resolveCustomer, salesRequest, type SaleCustomer } from '../infrastructure/sales-api';
import { ProductImage } from '../presentation/components/product-image';
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
  imagenUrl?: string|null;
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
              imagenUrl?: string|null;
            }) => ({
              id: p.id,
              codigo: p.codigo,
              nombre: p.nombre,
              categoria: p.categoriaNombre || 'General',
              precio: Number(p.precioVenta) || 0,
              stock: Number(p.stockDisponible) || 0,
              unidad: p.unidadBase || 'UNIDAD',
              requiereSerie: Boolean(p.requiereSerie),
              imagenUrl: p.imagenUrl,
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
  const cartItemsCount = cart.reduce((acc, item) => acc + item.cantidad, 0);
  const scrollToCheckout = () => {
    document.getElementById('pos-checkout')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Render product visual / icon with high fidelity
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

        <div className="pos-top-right">
          <button
            type="button"
            className="pos-top-cart-btn"
            onClick={scrollToCheckout}
            title="Ir al comprobante"
          >
            <FaCartShopping size={14} />
            <span>{cartItemsCount}</span>
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
                    <ProductImage src={p.imagenUrl} />
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

                </div>
              );
            })}
          </div>
        </section>

        {/* ================= RIGHT COLUMN: CHECKOUT PANEL ================= */}
        <aside id="pos-checkout" className="pos-checkout-pane" aria-label="Cliente y comprobante de venta">
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

      {cart.length > 0 && (
        <div className="pos-mobile-cart-bar">
          <div className="pos-mobile-cart-info">
            <span className="pos-mobile-cart-count">{cartItemsCount} {cartItemsCount === 1 ? 'ítem' : 'ítems'}</span>
            <strong className="pos-mobile-cart-total">S/ {total.toFixed(2)}</strong>
          </div>
          <button type="button" className="pos-mobile-cart-cta" onClick={scrollToCheckout}>
            <FaCartShopping size={14} /> Ver comprobante / Cobrar
          </button>
        </div>
      )}

      {serialItem && <SerialPicker productId={serialItem.productoId} name={serialItem.nombre} quantity={serialItem.cantidad} initial={serialItem.series} load={loadSerials}
        onClose={() => setSerialProductId(null)} onSave={selected => { setCart(rows => rows.map(row => row.productoId === serialItem.productoId ? { ...row, series: selected } : row)); setSerialProductId(null); }} />}

      {/* ================= VUELTO / CAMBIO MODAL ================= */}
      {showVueltoModal && (
        <div className="pos-modal-backdrop" onClick={() => setShowVueltoModal(false)}>
          <div className="pos-modal-card pos-modal-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="pos-modal-title">Calculadora de Vuelto</h3>
            <p className="pos-modal-sub">
              Efectivo a cobrar: <strong>S/ {cashDue.toFixed(2)}</strong>
            </p>

            <label className="pos-modal-label">
              Cliente paga con (S/):
            </label>
            <input
              type="number"
              className="pos-vuelto-input"
              value={pagaCon}
              onChange={(e) => setPagaCon(e.target.value)}
              placeholder="0.00"
              autoFocus
            />

            <div className="pos-vuelto-bills">
              {[10, 20, 50, 100, 200].map((billete) => (
                <button
                  key={billete}
                  type="button"
                  className="pos-vuelto-bill-btn"
                  onClick={() => setPagaCon(String(billete))}
                >
                  S/ {billete}
                </button>
              ))}
            </div>

            <div className={`pos-vuelto-box ${vuelto > 0 ? 'has-change' : ''}`}>
              <span className="pos-vuelto-box-label">Vuelto a entregar:</span>
              <span className="pos-vuelto-box-val">
                S/ {vuelto.toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              className="pos-modal-primary-btn"
              onClick={() => setShowVueltoModal(false)}
            >
              Listo
            </button>
          </div>
        </div>
      )}

      {/* ================= SUCCESS SALE MODAL ================= */}
      {successSale && (
        <div className="pos-modal-backdrop">
          <div className="pos-modal-card pos-modal-md pos-modal-center">
            <CheckCircle2 size={56} color="#10b981" style={{ margin: '0 auto 12px' }} />
            <h2 className="pos-modal-title-lg">¡Venta Emitida con Éxito!</h2>
            <p className="pos-modal-sub">
              Comprobante <strong>{successSale.docType} N° {successSale.id}</strong> registrado correctamente.
            </p>

            <div className="pos-success-summary">
              <div className="pos-success-row">
                <span>Cliente:</span>
                <strong>{clientName || 'CLIENTES VARIOS'}</strong>
              </div>
              <div className="pos-success-row">
                <span>Método:</span>
                <strong>{successSale.pagos.map(p => `${p.metodo}: S/ ${p.monto.toFixed(2)}`).join(' · ')}</strong>
              </div>
              <div className="pos-success-row">
                <span>Total cobrado:</span>
                <strong className="pos-success-total">S/ {successSale.total.toFixed(2)}</strong>
              </div>
            </div>

            <div className="pos-success-actions">
              <button
                type="button"
                className="pos-print-btn"
                onClick={() => {
                  window.print();
                }}
              >
                Imprimir Ticket
              </button>
              <button
                type="button"
                className="pos-new-sale-btn"
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
