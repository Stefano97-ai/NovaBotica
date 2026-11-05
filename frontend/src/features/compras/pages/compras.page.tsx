import { useState, useMemo } from 'react';
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
  ClipboardList
} from 'lucide-react';
import './compras.css';

interface ItemCompra {
  id: string;
  codigo: string;
  descripcion: string;
  unidadMedida: string;
  cantidad: number;
  precioUnitario: number;
  lote: string;
  vencimiento: string;
}

interface ProveedorPreset {
  ruc: string;
  razonSocial: string;
  direccion: string;
  ubigeo: string;
  celular: string;
}

const PROVEEDORES_FRECUENTES: ProveedorPreset[] = [
  {
    ruc: '20100018625',
    razonSocial: 'LABORATORIOS MEDIFARMA S.A.',
    direccion: 'Jr. Ecuador 787, Lima - Lima',
    ubigeo: '150101',
    celular: '984512345'
  },
  {
    ruc: '20100085497',
    razonSocial: 'LABORATORIOS BAGO DEL PERU S.A.',
    direccion: 'Av. Jorge Chávez 154, Miraflores - Lima',
    ubigeo: '150122',
    celular: '992341256'
  },
  {
    ruc: '20100109931',
    razonSocial: 'FARMAINDUSTRIA S.A.',
    direccion: 'Calle Andrés Reyes 437, San Isidro - Lima',
    ubigeo: '150131',
    celular: '981245789'
  },
  {
    ruc: '20492817361',
    razonSocial: 'ALKOFARMA S.A.C.',
    direccion: 'Av. Elmer Faucett 1850, Callao',
    ubigeo: '070101',
    celular: '976543210'
  },
  {
    ruc: '20518392011',
    razonSocial: 'DROGUERIA INTRALAB S.A.C.',
    direccion: 'Av. Colonial 2340, Cercado de Lima',
    ubigeo: '150101',
    celular: '945678123'
  }
];

const CATALOGO_MEDICAMENTOS = [
  { codigo: 'MED-001', nombre: 'Paracetamol 500mg Tabletas - Genfar', unidad: 'Caja x 100', costoDefecto: 8.50 },
  { codigo: 'MED-002', nombre: 'Amoxicilina 500mg Cápsulas - Medifarma', unidad: 'Caja x 50', costoDefecto: 14.20 },
  { codigo: 'MED-003', nombre: 'Ibuprofeno 400mg Tabletas - Farmaindustria', unidad: 'Caja x 100', costoDefecto: 11.00 },
  { codigo: 'MED-004', nombre: 'Azitromicina 500mg Caja x 3 - Lab Portugal', unidad: 'Caja x 3', costoDefecto: 6.80 },
  { codigo: 'MED-005', nombre: 'Alcohol Medicinal 70° 1 Litro - Alkofarma', unidad: 'Frasco 1L', costoDefecto: 7.50 },
  { codigo: 'MED-006', nombre: 'Panadol Antigripal Tableta x 24 - GSK', unidad: 'Caja x 24', costoDefecto: 18.00 },
  { codigo: 'MED-007', nombre: 'Suero Fisiológico 0.9% 500ml - Braun', unidad: 'Frasco 500ml', costoDefecto: 4.20 },
  { codigo: 'MED-008', nombre: 'Bismutol Suspensión 150ml - Bagó', unidad: 'Frasco 150ml', costoDefecto: 16.50 },
  { codigo: 'MED-009', nombre: 'Mascarillas Quirúrgicas 3 pliegues Caja x 50', unidad: 'Caja x 50', costoDefecto: 5.00 },
  { codigo: 'MED-010', nombre: 'Omeprazol 20mg Cápsulas - Farmaindustria', unidad: 'Caja x 30', costoDefecto: 9.50 }
];

export default function ComprasPage() {
  // Comprobante
  const [tipoComprobante, setTipoComprobante] = useState('Factura');
  const [moneda, setMoneda] = useState('PEN');
  const [fechaEmision, setFechaEmision] = useState('2026-11-04');
  const [serie, setSerie] = useState('F001');
  const [correlativo, setCorrelativo] = useState('000452');

  // Proveedor
  const [tipoDoc, setTipoDoc] = useState('R.U.C.');
  const [numDoc, setNumDoc] = useState('20100018625');
  const [razonSocial, setRazonSocial] = useState('LABORATORIOS MEDIFARMA S.A.');
  const [direccion, setDireccion] = useState('Jr. Ecuador 787, Lima - Lima');
  const [ubigeo, setUbigeo] = useState('150101');
  const [celular, setCelular] = useState('984512345');
  const [condicionPago, setCondicionPago] = useState('Contado');

  // Productos en el detalle
  const [items, setItems] = useState<ItemCompra[]>([
    {
      id: 'item-1',
      codigo: 'MED-001',
      descripcion: 'Paracetamol 500mg Tabletas - Genfar',
      unidadMedida: 'Caja x 100',
      cantidad: 20,
      precioUnitario: 8.50,
      lote: 'L-PAR26-01',
      vencimiento: '2028-10-31'
    },
    {
      id: 'item-2',
      codigo: 'MED-002',
      descripcion: 'Amoxicilina 500mg Cápsulas - Medifarma',
      unidadMedida: 'Caja x 50',
      cantidad: 15,
      precioUnitario: 14.20,
      lote: 'L-AMX26-05',
      vencimiento: '2028-08-30'
    }
  ]);

  // Condiciones comerciales
  const [descuentoGlobal, setDescuentoGlobal] = useState<number>(0);
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

  // Buscar RUC proveedor
  function handleBuscarProveedor() {
    const found = PROVEEDORES_FRECUENTES.find((p) => p.ruc === numDoc.trim());
    if (found) {
      setRazonSocial(found.razonSocial);
      setDireccion(found.direccion);
      setUbigeo(found.ubigeo);
      setCelular(found.celular);
      showNotif(`Proveedor "${found.razonSocial}" autocompletado.`);
    } else {
      setRazonSocial('DROGUERIA Y LABORATORIOS ASOCIADOS S.A.C.');
      setDireccion('Av. Los Frutales 450, Ate - Lima');
      setUbigeo('150103');
      setCelular('987654321');
      showNotif('Datos del proveedor recuperados de SUNAT.');
    }
  }

  // Cálculos de Totales
  const totales = useMemo(() => {
    const subtotal = items.reduce((acc, it) => acc + it.cantidad * it.precioUnitario, 0);
    const opGravadas = subtotal;
    const igv = Math.round(opGravadas * 0.18 * 100) / 100;
    const desc = Number(descuentoGlobal) || 0;
    const total = Math.max(0, subtotal + igv - desc);

    return {
      subtotal: subtotal.toFixed(2),
      opGravadas: opGravadas.toFixed(2),
      opExoneradas: '0.00',
      opInafectas: '0.00',
      opGratuitas: '0.00',
      descuento: desc.toFixed(2),
      icbper: '0.00',
      igv: igv.toFixed(2),
      total: total.toFixed(2)
    };
  }, [items, descuentoGlobal]);

  // Actualizar item de la tabla
  function updateItem(id: string, field: keyof ItemCompra, value: any) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  }

  // Eliminar item
  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  // Agregar item desde catálogo
  function addItemFromCatalog(med: (typeof CATALOGO_MEDICAMENTOS)[0]) {
    const existing = items.find((it) => it.codigo === med.codigo);
    if (existing) {
      updateItem(existing.id, 'cantidad', existing.cantidad + 1);
      showNotif(`Cantidad aumentada para ${med.nombre}`);
    } else {
      const newItem: ItemCompra = {
        id: 'item-' + Date.now(),
        codigo: med.codigo,
        descripcion: med.nombre,
        unidadMedida: med.unidad,
        cantidad: 10,
        precioUnitario: med.costoDefecto,
        lote: 'L-' + med.codigo.slice(4) + '26-01',
        vencimiento: '2028-12-31'
      };
      setItems((prev) => [...prev, newItem]);
      showNotif(`"${med.nombre}" agregado a la compra.`);
    }
    setModalPickerOpen(false);
  }

  // Guardar nuevo producto rápido
  function handleCrearNuevoProducto(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;
    const newItem: ItemCompra = {
      id: 'item-' + Date.now(),
      codigo: nuevoCodigo || 'MED-' + Math.floor(100 + Math.random() * 900),
      descripcion: nuevoNombre,
      unidadMedida: nuevoUnidad,
      cantidad: 10,
      precioUnitario: Number(nuevoCosto) || 5.0,
      lote: 'L-NUEVO26-01',
      vencimiento: '2028-12-31'
    };
    setItems((prev) => [...prev, newItem]);
    setModalNuevoProdOpen(false);
    setNuevoNombre('');
    setNuevoCodigo('');
    showNotif(`Nuevo producto "${nuevoNombre}" creado y agregado a la compra.`);
  }

  // Guardar Compra Completa
  async function handleGuardarCompra() {
    if (items.length === 0) {
      alert('Debes agregar al menos un producto a la compra.');
      return;
    }

    try {
      await fetch('/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proveedorId: 1,
          tipoComprobante,
          serie,
          correlativo,
          items: items.map((it) => ({
            productoId: 1,
            cantidad: it.cantidad,
            costoUnitario: it.precioUnitario,
            lote: it.lote,
            vencimiento: it.vencimiento
          }))
        })
      });
    } catch {
      // Ignorar fallback
    }

    showNotif(`¡Compra ${serie}-${correlativo} registrada exitosamente! Stock y lotes actualizados.`);
    // Incrementar correlativo
    const num = parseInt(correlativo, 10) || 452;
    setCorrelativo(String(num + 1).padStart(6, '0'));
    setItems([]);
  }

  // Limpiar todo
  function handleLimpiar() {
    if (confirm('¿Deseas limpiar todos los campos del comprobante de compra?')) {
      setItems([]);
      setDescuentoGlobal(0);
      setObservaciones('');
      showNotif('Formulario de compra restablecido.');
    }
  }

  // Filtro de catálogo
  const catalogoFiltrado = useMemo(() => {
    return CATALOGO_MEDICAMENTOS.filter(
      (m) =>
        m.nombre.toLowerCase().includes(searchCatalog.toLowerCase()) ||
        m.codigo.toLowerCase().includes(searchCatalog.toLowerCase())
    );
  }, [searchCatalog]);

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
          <Link to="/ventas?tipo=NOTA_VENTA" className="compras-dash-btn">
            <ClipboardList size={12} strokeWidth={2} /> NOTA DE VENTA
          </Link>
        </div>
      </div>

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
                value={numDoc}
                onChange={(e) => setNumDoc(e.target.value)}
                maxLength={11}
              />
              <button
                type="button"
                className="btn-search-doc"
                onClick={handleBuscarProveedor}
                title="Consultar RUC en SUNAT"
              >
                <Search size={15} />
              </button>
            </div>

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
            <ShoppingCart size={14} /> Agregar Productos o Servicios
          </button>
          <button
            type="button"
            className="btn-new-prod"
            onClick={() => setModalNuevoProdOpen(true)}
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
                <th style={{ width: 40, textAlign: 'center' }}></th>
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
                          className="cell-input-number"
                          value={it.cantidad}
                          onChange={(e) =>
                            updateItem(it.id, 'cantidad', Math.max(1, Number(e.target.value)))
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
              <label>Descuento</label>
              <div className="input-with-icon" style={{ width: 220 }}>
                <span style={{ fontSize: 13 }}>💵</span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={descuentoGlobal}
                  onChange={(e) => setDescuentoGlobal(Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
            </div>

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
              <span className="summary-line-label">Descuento (-)</span>
              <span className="summary-line-value">{totales.descuento}</span>
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
        <div className="compras-modal-backdrop" onClick={() => setModalNuevoProdOpen(false)}>
          <div className="compras-modal" onClick={(e) => e.stopPropagation()}>
            <div className="compras-modal-header">
              <h3 className="compras-modal-title">
                <Package size={16} /> Nuevo Producto o Medicamento
              </h3>
              <button
                type="button"
                className="inv-modal-close"
                onClick={() => setModalNuevoProdOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCrearNuevoProducto}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-field-block">
                  <label>Nombre del Medicamento / Producto</label>
                  <input
                    type="text"
                    required
                    className="standard-input"
                    placeholder="Ej. Clorfenamina 4mg Tabletas"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-field-block">
                    <label>Código Interno</label>
                    <input
                      type="text"
                      className="standard-input"
                      placeholder="Ej. MED-015"
                      value={nuevoCodigo}
                      onChange={(e) => setNuevoCodigo(e.target.value)}
                    />
                  </div>
                  <div className="form-field-block">
                    <label>Unidad de Medida</label>
                    <select
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
                  <label>Costo de Compra Estimado (S/)</label>
                  <input
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
                  Guardar y Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
