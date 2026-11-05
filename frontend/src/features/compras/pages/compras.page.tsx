import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  FileText,
  Coins,
  Calendar,
  Search,
  RotateCcw,
  ShoppingCart,
  PlusSquare,
  Trash2,
  Save,
  MessageSquare,
  CheckCircle2,
  X,
  Package,
  Receipt,
  ListChecks,
  ClipboardList
} from 'lucide-react';
import { purchaseError, type PurchaseItem as ItemCompra, type PurchaseProduct, type PurchaseSupplier, type PurchaseCategory } from '../domain/purchase';
import { loadPurchaseCatalog, createPurchaseProduct, registerPurchase } from '../infrastructure/purchases-api';
import { PurchaseSerials } from '../presentation/components/purchase-serials';
import './compras.css';

export default function ComprasPage() {
  // Comprobante
  const [tipoComprobante, setTipoComprobante] = useState('Factura');
  const [moneda, setMoneda] = useState('PEN');
  const [fechaEmision, setFechaEmision] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }));
  const [serie, setSerie] = useState('F001');
  const [correlativo, setCorrelativo] = useState('000452');

  // Proveedor
  const [tipoDoc, setTipoDoc] = useState('R.U.C.');
  const [numDoc, setNumDoc] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ubigeo, setUbigeo] = useState('150101');
  const [celular, setCelular] = useState('');
  const [condicionPago, setCondicionPago] = useState('Contado');

  // Productos en el detalle
  const [items, setItems] = useState<ItemCompra[]>([]);

  // Condiciones comerciales
  const [metodoPago, setMetodoPago] = useState('En efectivo');
  const [observaciones, setObservaciones] = useState('');

  // Modales y Feedback
  const [modalPickerOpen, setModalPickerOpen] = useState(false);
  const [modalNuevoProdOpen, setModalNuevoProdOpen] = useState(false);
  const [searchCatalog, setSearchCatalog] = useState('');
  const [notif, setNotif] = useState<string | null>(null);

  // Form nuevo producto
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoCodigo, setNuevoCodigo] = useState('');
  const [nuevoUnidad, setNuevoUnidad] = useState('Caja x 100');
  const [nuevoCosto, setNuevoCosto] = useState<number>(10.00);

  function showNotif(msg: string) {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3500);
  }

  const [catalog, setCatalog] = useState<PurchaseProduct[]>([]);
  const [suppliers, setSuppliers] = useState<PurchaseSupplier[]>([]);
  const [categories, setCategories] = useState<PurchaseCategory[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [productError, setProductError] = useState('');
  const [nuevoRequiereSerie, setNuevoRequiereSerie] = useState(false);
  const [nuevoCategoria, setNuevoCategoria] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState(0);
  const [serialItemId, setSerialItemId] = useState<string | null>(null);
  const serialItem = items.find(i => i.id === serialItemId);
  useEffect(() => {
    const controller = new AbortController(); let active = true;
    const timeout = setTimeout(() => controller.abort(), 15000);
    setCatalogLoading(true); setError('');
    loadPurchaseCatalog(controller.signal).then(data => {
      if (!active) return;
      setCatalog(data.products); setSuppliers(data.suppliers); setCategories(data.categories);
      setNuevoCategoria(old => old || String(data.categories[0]?.id ?? ''));
    }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'No se pudo cargar el catálogo.'); })
      .finally(() => { clearTimeout(timeout); if (active) setCatalogLoading(false); });
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [catalogVersion]);

  function handleBuscarProveedor() {
    const found = suppliers.find(p => p.ruc === numDoc.trim());
    if (!found) { setError('No existe un proveedor activo con ese RUC. Regístralo en Proveedores antes de guardar la compra.'); return; }
    setError(''); setRazonSocial(found.razonSocial); setDireccion(found.direccion || ''); setCelular(found.telefono || '');
    showNotif(`Proveedor "${found.razonSocial}" seleccionado.`);
  }
  // Cálculos de Totales
  const totales = useMemo(() => {
    const subtotal = items.reduce((acc, it) => acc + it.cantidad * it.precioUnitario, 0);
    const opGravadas = subtotal;
    const igv = Math.round(opGravadas * 0.18 * 100) / 100;
    const total = subtotal + igv;

    return {
      subtotal: subtotal.toFixed(2),
      opGravadas: opGravadas.toFixed(2),
      opExoneradas: '0.00',
      opInafectas: '0.00',
      opGratuitas: '0.00',
      icbper: '0.00',
      igv: igv.toFixed(2),
      total: total.toFixed(2)
    };
  }, [items]);

  // Actualizar item de la tabla
  function updateItem<K extends keyof ItemCompra>(id: string, field: K, value: ItemCompra[K]) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
  }
  // Eliminar item
  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  // Agregar item desde catálogo
  function addItemFromCatalog(med: PurchaseProduct) {
    const existing = items.find((it) => it.codigo === med.codigo);
    if (existing) {
      updateItem(existing.id, 'cantidad', existing.cantidad + 1);
      showNotif(`Cantidad aumentada para ${med.nombre}`);
    } else {
      const newItem: ItemCompra = {
        id: crypto.randomUUID(),
        productoId: med.id,
        requiereSerie: med.requiereSerie,
        series: [],
        codigo: med.codigo,
        descripcion: med.nombre,
        unidadMedida: med.unidad,
        cantidad: 10,
        precioUnitario: med.costoDefecto,
        lote: '',
        vencimiento: ''
      };
      setItems((prev) => [...prev, newItem]);
      showNotif(`"${med.nombre}" agregado a la compra.`);
    }
    setModalPickerOpen(false);
  }

  async function handleCrearNuevoProducto(e: React.FormEvent) {
    e.preventDefault();
    if (creatingProduct) return;
    setCreatingProduct(true); setProductError('');
    try {
      const product = await createPurchaseProduct({ categoriaId: Number(nuevoCategoria), codigo: nuevoCodigo.trim(), nombre: nuevoNombre.trim(),
        unidadBase: nuevoUnidad, precioVenta: nuevoPrecio, requiereSerie: nuevoRequiereSerie });
      setCatalog(old => [...old, product]);
      addItemFromCatalog({ ...product, costoDefecto: nuevoCosto });
      setModalNuevoProdOpen(false); setNuevoNombre(''); setNuevoCodigo(''); setNuevoRequiereSerie(false);
      showNotif(`Producto "${product.nombre}" creado y agregado. Completa el lote, vencimiento y las series si corresponde.`);
    } catch (reason) { setProductError(reason instanceof Error ? reason.message : 'No se pudo crear el producto.'); }
    finally { setCreatingProduct(false); }
  }

  async function handleGuardarCompra() {
    if (saving) return;
    const invalid = purchaseError(items);
    if (invalid) { setError(invalid); return; }
    const supplier = suppliers.find(p => p.ruc === numDoc.trim());
    if (!supplier) { setError('Selecciona un proveedor activo registrado con el RUC indicado.'); return; }
    setSaving(true); setError('');
    try {
      const purchase = await registerPurchase(supplier.id, items);
      showNotif(`Compra #${purchase.id} recibida. Stock, lotes y series registrados correctamente.`);
      setItems([]); setCorrelativo(String((parseInt(correlativo, 10) || 0) + 1).padStart(6, '0'));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo guardar la compra. Se conserva el formulario.'); }
    finally { setSaving(false); }
  }
  // Limpiar todo
  function handleLimpiar() {
    if (confirm('¿Deseas limpiar todos los campos del comprobante de compra?')) {
      setItems([]);
      setObservaciones('');
      showNotif('Formulario de compra restablecido.');
    }
  }

  // Filtro de catálogo
  const catalogoFiltrado = useMemo(() => {
    return catalog.filter(
      (m) =>
        m.nombre.toLowerCase().includes(searchCatalog.toLowerCase()) ||
        m.codigo.toLowerCase().includes(searchCatalog.toLowerCase())
    );
  }, [searchCatalog, catalog]);

  return (
    <div className="compras-page">
      {/* 1. Subheader Bar con accesos directos */}
      <div className="compras-bar">
        <h1 className="compras-bar-title">
          <Truck size={15} strokeWidth={2.2} /> REGISTRO DE COMPRAS
        </h1>
        <div className="compras-actions">
          <Link to="/ventas?tipo=FACTURA" className="compras-dash-btn">
            <FileText size={12} strokeWidth={2} /> EMITIR FACTURA
          </Link>
          <Link to="/ventas?tipo=BOLETA" className="compras-dash-btn">
            <Receipt size={12} strokeWidth={2} /> EMITIR BOLETA
          </Link>
        </div>
      </div>

      {error && <div className="purchase-error" role="alert">{error} <button type="button" onClick={() => setCatalogVersion(v => v + 1)}>Actualizar catálogo</button></div>}
      {catalogLoading && <p role="status">Cargando productos, categorías y proveedores…</p>}
      <fieldset className="purchase-fields" disabled={saving}>
      {/* Notificación Flash */}
      {notif && (
        <div style={{
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
        }}>
          <CheckCircle2 size={16} />
          <span>{notif}</span>
        </div>
      )}

      {/* 2. Main Card Panel */}
      <div className="compras-card">
        {/* ROW 1: Comprobante Header */}
        <div className="compras-row-voucher">
          <div className="input-with-icon" title="Tipo de Comprobante">
            <FileText size={15} color="#475569" />
            <select
              value={tipoComprobante}
              onChange={(e) => setTipoComprobante(e.target.value)}
              aria-label="Tipo de Comprobante"
            >
              <option value="Factura">Factura</option>
              <option value="Boleta">Boleta</option>
              <option value="Guía de Remisión">Guía de Remisión</option>
              <option value="Nota de Entrada">Nota de Entrada</option>
            </select>
          </div>

          <div className="input-with-icon" title="Moneda">
            <Coins size={15} color="#475569" />
            <select
              value={moneda}
              onChange={(e) => setMoneda(e.target.value)}
              aria-label="Moneda"
            >
              <option value="PEN">Soles (S/)</option>
              <option value="USD">Dólares ($)</option>
            </select>
          </div>

          <div className="input-with-icon" title="Fecha de Emisión">
            <Calendar size={15} color="#475569" />
            <input
              type="date"
              value={fechaEmision}
              onChange={(e) => setFechaEmision(e.target.value)}
              aria-label="Fecha de Emisión"
            />
          </div>

          <div className="input-with-icon" title="Serie">
            <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>SERIE</span>
            <input
              type="text"
              value={serie}
              onChange={(e) => setSerie(e.target.value.toUpperCase())}
              placeholder="F001"
              maxLength={4}
            />
          </div>

          <div className="input-with-icon" title="Correlativo">
            <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>N°</span>
            <input
              type="text"
              value={correlativo}
              onChange={(e) => setCorrelativo(e.target.value)}
              placeholder="000452"
            />
          </div>

          <button
            type="button"
            className="btn-row-clear"
            onClick={handleLimpiar}
            title="Limpiar comprobante"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* SECTION 2: DATOS PROVEEDOR */}
        <div className="compras-supplier-section">
          <span className="supplier-label">Datos Proveedor:</span>

          <div className="supplier-row-1">
            <div className="input-with-icon">
              <select value={tipoDoc} onChange={(e) => setTipoDoc(e.target.value)}>
                <option value="R.U.C.">R.U.C.</option>
                <option value="D.N.I.">D.N.I.</option>
              </select>
            </div>

            <div className="doc-input-wrap">
              <input
                type="text"
                placeholder="Ingrese número de documento..."
                list="purchase-suppliers"
                aria-label="RUC del proveedor"
                value={numDoc}
                onChange={(e) => setNumDoc(e.target.value)}
                maxLength={11}
              />
              <button
                type="button"
                className="btn-search-doc"
                onClick={handleBuscarProveedor}
                title="Buscar proveedor registrado"
              >
                <Search size={15} />
              </button>
            </div>
            <datalist id="purchase-suppliers">{suppliers.map(supplier => <option key={supplier.id} value={supplier.ruc}>{supplier.razonSocial}</option>)}</datalist>

            <input
              type="text"
              className="standard-input"
              placeholder="Ingrese nombre o razón social..."
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value)}
            />
          </div>

          <div className="supplier-row-2">
            <input
              type="text"
              className="standard-input"
              placeholder="Ingrese la dirección..."
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
            />
            <input
              type="text"
              className="standard-input"
              placeholder="Ingrese código de ubigeo..."
              value={ubigeo}
              onChange={(e) => setUbigeo(e.target.value)}
            />
            <div className="input-with-icon">
              <span style={{ fontSize: 13 }}>🇵🇪 +51</span>
              <input
                type="text"
                placeholder="Ingrese su número de celular..."
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
              />
            </div>
          </div>

          <div className="supplier-row-3">
            <label>¿Contado o Crédito?</label>
            <div className="input-with-icon">
              <select
                value={condicionPago}
                onChange={(e) => setCondicionPago(e.target.value)}
              >
                <option value="Contado">Contado</option>
                <option value="Crédito 30 días">Crédito (30 días)</option>
                <option value="Crédito 60 días">Crédito (60 días)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 3: Action buttons above table */}
        <div className="compras-actions-bar">
          <button
            type="button"
            className="btn-add-prods"
            onClick={() => setModalPickerOpen(true)}
          >
            <ShoppingCart size={14} /> Agregar Productos
          </button>
          <button
            type="button"
            className="btn-new-prod"
            disabled={catalogLoading}
            onClick={() => { setProductError(''); setModalNuevoProdOpen(true); }}
          >
            Nuevo Producto o Servicio <PlusSquare size={14} />
          </button>
        </div>

        {/* SECTION 4: Products Table */}
        <div className="compras-table-wrap">
          <table className="compras-table">
            <thead>
              <tr>
                <th style={{ width: 85 }}>CÓDIGO</th>
                <th style={{ width: 75 }}>CANTIDAD</th>
                <th style={{ width: 100 }}>UNI/MEDIDA</th>
                <th>DESCRIPCIÓN</th>
                <th style={{ width: 110, textAlign: 'right' }}>PRECIO UNITARIO</th>
                <th style={{ width: 100, textAlign: 'right' }}>VALOR UNITARIO</th>
                <th style={{ width: 95, textAlign: 'right' }}>SUB.TOTAL</th>
                <th style={{ width: 95, textAlign: 'right' }}>TOTAL</th>
                <th style={{ width: 110 }}>LOTE</th>
                <th style={{ width: 120 }}>VENCE</th>
                <th style={{ width: 140, textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="empty-table-row">
                    No hay productos agregados a este comprobante. Haz clic en "AGREGAR PRODUCTOS" arriba.
                  </td>
                </tr>
              ) : (
                items.map((it) => {
                  const sub = it.cantidad * it.precioUnitario;
                  const totalLine = sub * 1.18;
                  return (
                    <tr key={it.id}>
                      <td style={{ color: '#475569', fontWeight: 700 }}>{it.codigo}</td>
                      <td>
                        <input
                          type="number"
                          min={1}
                          max={10000}
                          step={1}
                          aria-label={`Cantidad de ${it.descripcion}`}
                          className="cell-input-number"
                          value={it.cantidad}
                          onChange={(e) =>
                            updateItem(it.id, 'cantidad', Math.max(1, Math.min(10000, Math.trunc(Number(e.target.value)) || 1)))
                          }
                        />
                      </td>
                      <td style={{ color: '#64748b' }}>{it.unidadMedida}</td>
                      <td style={{ color: '#0f172a' }}>{it.descripcion}</td>
                      <td style={{ textAlign: 'right' }}>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          className="cell-input-number"
                          value={it.precioUnitario}
                          onChange={(e) =>
                            updateItem(it.id, 'precioUnitario', Number(e.target.value))
                          }
                        />
                      </td>
                      <td style={{ textAlign: 'right', color: '#64748b' }}>
                        S/ {it.precioUnitario.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', color: '#334155' }}>
                        S/ {sub.toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', color: '#047857', fontWeight: 800 }}>
                        S/ {totalLine.toFixed(2)}
                      </td>
                      <td>
                        <input
                          type="text"
                          className="cell-input-text"
                          value={it.lote}
                          onChange={(e) => updateItem(it.id, 'lote', e.target.value)}
                          placeholder="Lote..."
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          className="cell-input-text"
                          value={it.vencimiento}
                          onChange={(e) => updateItem(it.id, 'vencimiento', e.target.value)}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {it.requiereSerie && <button type="button" className="purchase-series-btn" onClick={() => setSerialItemId(it.id)} aria-label={`Registrar series de ${it.descripcion}`}>
                          <ListChecks size={15} /> Series {it.series.length}/{it.cantidad}
                        </button>}
                        <button
                          type="button"
                          className="btn-del-item"
                          onClick={() => removeItem(it.id)}
                          title="Quitar producto"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* SECTION 5: Conditions (Left) & Totals Summary (Right) */}
        <div className="compras-bottom-grid">
          {/* Left Column */}
          <div className="compras-left-col">
            <div className="form-field-block">
              <label>Método de Pago:</label>
              <div className="input-with-icon" style={{ width: 300 }}>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                >
                  <option value="En efectivo">En efectivo</option>
                  <option value="Transferencia Bancaria (BCP/BBVA)">
                    Transferencia Bancaria (BCP/BBVA)
                  </option>
                  <option value="Yape / Plin">Yape / Plin</option>
                  <option value="Crédito 30 días">Crédito 30 días</option>
                  <option value="Crédito 60 días">Crédito 60 días</option>
                </select>
              </div>
            </div>

            <div className="form-field-block">
              <label>Observaciones</label>
              <div className="textarea-with-icon">
                <MessageSquare size={16} color="#94a3b8" style={{ marginTop: 2 }} />
                <textarea
                  placeholder="Ingrese observaciones adicionales de la compra o guía de entrega..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Right Column: RESUMEN / TOTALS */}
          <div className="compras-summary-panel">
            <span className="summary-heading">RESUMEN</span>

            <div className="summary-line">
              <span className="summary-line-label">Subtotal</span>
              <span className="summary-line-value">{totales.subtotal}</span>
            </div>

            <div className="summary-line">
              <span className="summary-line-label">Op.Gravadas</span>
              <span className="summary-line-value">{totales.opGravadas}</span>
            </div>

            <div className="summary-line">
              <span className="summary-line-label">Op.Exoneradas</span>
              <span className="summary-line-value">{totales.opExoneradas}</span>
            </div>

            <div className="summary-line">
              <span className="summary-line-label">Op.Inafectas</span>
              <span className="summary-line-value">{totales.opInafectas}</span>
            </div>

            <div className="summary-line">
              <span className="summary-line-label">Op.Gratuitas</span>
              <span className="summary-line-value">{totales.opGratuitas}</span>
            </div>

            <div className="summary-line">
              <span className="summary-line-label">ICBPER</span>
              <span className="summary-line-value">{totales.icbper}</span>
            </div>

            <div className="summary-line">
              <span className="summary-line-label">IGV (18%)</span>
              <span className="summary-line-value">{totales.igv}</span>
            </div>

            <div className="summary-line line-total">
              <span className="summary-line-label">TOTAL (S/)</span>
              <span className="summary-line-value">{totales.total}</span>
            </div>
          </div>
        </div>

        {/* SECTION 6: Action buttons at the bottom */}
        <div className="compras-footer-actions">
          <button
            type="button"
            className="btn-save-purchase"
            disabled={saving || catalogLoading}
            aria-label="Guardar y recibir compra"
            onClick={handleGuardarCompra}
            title="Guardar y procesar compra"
          >
            <Save size={22} />
          </button>
          <button
            type="button"
            className="btn-clear-purchase"
            onClick={handleLimpiar}
            title="Limpiar formulario"
          >
            <Trash2 size={22} />
          </button>
        </div>
      </div>
      </fieldset>

      {serialItem && <PurchaseSerials key={serialItem.id} name={serialItem.descripcion} quantity={serialItem.cantidad} initial={serialItem.series}
        otherSeries={items.filter(i => i.id !== serialItem.id).flatMap(i => i.series)}
        onClose={() => setSerialItemId(null)} onSave={series => { updateItem(serialItem.id, 'series', series); setSerialItemId(null); }} />}

      {/* ================= MODAL PICKER DE PRODUCTOS ================= */}
      {modalPickerOpen && (
        <div className="compras-modal-backdrop" onClick={() => setModalPickerOpen(false)}>
          <div className="compras-modal" onClick={(e) => e.stopPropagation()}>
            <div className="compras-modal-header">
              <h3 className="compras-modal-title">
                <ShoppingCart size={16} /> Catálogo de Medicamentos
              </h3>
              <button
                type="button"
                className="inv-modal-close"
                onClick={() => setModalPickerOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <input
              type="text"
              className="catalog-search-input"
              placeholder="Buscar medicamento por nombre o código..."
              value={searchCatalog}
              onChange={(e) => setSearchCatalog(e.target.value)}
              autoFocus
            />

            <div className="catalog-list">
              {catalogoFiltrado.map((med) => (
                <div
                  key={med.codigo}
                  className="catalog-item"
                  onClick={() => addItemFromCatalog(med)}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: '#0f172a' }}>
                      {med.nombre}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      Código: {med.codigo} · {med.unidad}
                      {med.requiereSerie && ' · Serie única por unidad'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#1f6f50' }}>
                      S/ {med.costoDefecto.toFixed(2)}
                    </div>
                    <span style={{ fontSize: 10, color: '#4f46e5', fontWeight: 600 }}>
                      + Agregar
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL NUEVO PRODUCTO RÁPIDO ================= */}
      {modalNuevoProdOpen && (
        <div className="compras-modal-backdrop" onClick={() => { if (!creatingProduct) setModalNuevoProdOpen(false); }}>
          <div className="compras-modal" role="dialog" aria-modal="true" aria-labelledby="new-purchase-product-title" onClick={(e) => e.stopPropagation()}>
            <div className="compras-modal-header">
              <h3 className="compras-modal-title" id="new-purchase-product-title">
                <Package size={16} /> Nuevo Producto o Medicamento
              </h3>
              <button
                type="button"
                className="inv-modal-close"
                disabled={creatingProduct}
                onClick={() => setModalNuevoProdOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCrearNuevoProducto}>
              <fieldset className="purchase-fields" disabled={creatingProduct}>
              {productError && <p className="purchase-error" role="alert">{productError}</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-field-block">
                  <label htmlFor="purchase-new-name">Nombre del Medicamento / Producto</label>
                  <input
                    id="purchase-new-name"
                    type="text"
                    required
                    minLength={2}
                    maxLength={180}
                    className="standard-input"
                    placeholder="Ej. Clorfenamina 4mg Tabletas"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-field-block">
                    <label htmlFor="purchase-new-code">Código Interno</label>
                    <input
                      id="purchase-new-code"
                      type="text"
                      className="standard-input"
                      placeholder="Ej. MED-015"
                      required
                      minLength={2}
                      maxLength={60}
                      value={nuevoCodigo}
                      onChange={(e) => setNuevoCodigo(e.target.value)}
                    />
                  </div>
                  <div className="form-field-block">
                    <label htmlFor="purchase-new-unit">Unidad de Medida</label>
                    <select
                      id="purchase-new-unit"
                      className="standard-input"
                      value={nuevoUnidad}
                      onChange={(e) => setNuevoUnidad(e.target.value)}
                    >
                      <option value="Caja x 100">Caja x 100</option>
                      <option value="Caja x 50">Caja x 50</option>
                      <option value="Caja x 24">Caja x 24</option>
                      <option value="Frasco 150ml">Frasco 150ml</option>
                      <option value="Frasco 1L">Frasco 1L</option>
                      <option value="Unidad">Unidad</option>
                      <option value="Blíster">Blíster</option>
                    </select>
                  </div>
                </div>

                <div className="form-field-block">
                  <label htmlFor="purchase-product-category">Categoría</label>
                  <select id="purchase-product-category" required className="standard-input" value={nuevoCategoria} onChange={e => setNuevoCategoria(e.target.value)}>
                    <option value="">Selecciona una categoría</option>
                    {categories.map(category => <option key={category.id} value={category.id}>{category.nombre}</option>)}
                  </select>
                </div>
                <div className="form-field-block">
                  <label htmlFor="purchase-product-price">Precio de venta (S/)</label>
                  <input id="purchase-product-price" type="number" min={0} step="0.01" required className="standard-input" value={nuevoPrecio} onChange={e => setNuevoPrecio(Number(e.target.value))} />
                </div>
                <label className="purchase-series-toggle"><input type="checkbox" checked={nuevoRequiereSerie} onChange={e => setNuevoRequiereSerie(e.target.checked)} />Este producto tiene serie única por unidad</label>
                <p className="purchase-series-help">Si lo activas, registra una serie distinta por cada unidad antes de guardar la compra.</p>
                <div className="form-field-block">
                  <label htmlFor="purchase-new-cost">Costo de Compra Estimado (S/)</label>
                  <input
                    id="purchase-new-cost"
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    className="standard-input"
                    value={nuevoCosto}
                    onChange={(e) => setNuevoCosto(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  className="inv-btn-cancel"
                  onClick={() => setModalNuevoProdOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="inv-btn-submit">
                  {creatingProduct ? 'Creando producto…' : 'Guardar y Agregar'}
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
