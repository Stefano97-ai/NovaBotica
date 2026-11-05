import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  ArrowLeftRight,
  Plus,
  LayoutGrid,
  Search,
  Calendar,
  FileSpreadsheet,
  FileText,
  Settings,
  X,
  CheckCircle2,
  AlertCircle,
  Receipt,
  ClipboardList
} from 'lucide-react';
import './inventario.css';

interface MovimientoItem {
  id: number;
  producto: string;
  movimiento: string;
  tipoMovimiento: 'VENTA' | 'COMPRA' | 'AJUSTE' | 'TRANSFERENCIA';
  fecha: string;
  cantidad: number;
  sede: string;
  lote: string;
}

const INITIAL_MOVIMIENTOS: MovimientoItem[] = [
  {
    id: 1,
    producto: 'Paracetamol 500mg Tabletas - Genfar',
    movimiento: 'Venta F001-65',
    tipoMovimiento: 'VENTA',
    fecha: '03/11/2026 11:57:31',
    cantidad: 2,
    sede: 'PRINCIPAL',
    lote: 'L-PAR24-01'
  },
  {
    id: 2,
    producto: 'Amoxicilina 500mg Cápsulas - Medifarma',
    movimiento: 'Venta F001-65',
    tipoMovimiento: 'VENTA',
    fecha: '03/11/2026 11:57:31',
    cantidad: 1,
    sede: 'PRINCIPAL',
    lote: 'L-AMX24-02'
  },
  {
    id: 3,
    producto: 'Ibuprofeno 400mg Tabletas - Farmaindustria',
    movimiento: 'Venta B001-94',
    tipoMovimiento: 'VENTA',
    fecha: '02/11/2026 23:09:31',
    cantidad: 2,
    sede: 'PRINCIPAL',
    lote: 'L-IBU24-05'
  },
  {
    id: 4,
    producto: 'Azitromicina 500mg Caja x 3 - Lab Portugal',
    movimiento: 'Venta F001-64',
    tipoMovimiento: 'VENTA',
    fecha: '02/11/2026 19:10:19',
    cantidad: 1,
    sede: 'PRINCIPAL',
    lote: 'L-AZI24-08'
  },
  {
    id: 5,
    producto: 'Alcohol Medicinal 70° 1 Litro - Alkofarma',
    movimiento: 'Venta F001-63',
    tipoMovimiento: 'VENTA',
    fecha: '02/11/2026 19:08:27',
    cantidad: 1,
    sede: 'PRINCIPAL',
    lote: 'L-ALC24-11'
  },
  {
    id: 6,
    producto: 'Panadol Antigripal Tableta x 24 - GSK',
    movimiento: 'Venta F001-63',
    tipoMovimiento: 'VENTA',
    fecha: '02/11/2026 19:08:27',
    cantidad: 1,
    sede: 'PRINCIPAL',
    lote: 'L-PAN24-03'
  },
  {
    id: 7,
    producto: 'Suero Fisiológico 0.9% 500ml - Braun',
    movimiento: 'Venta B001-93 (Pack de 6)',
    tipoMovimiento: 'VENTA',
    fecha: '02/11/2026 19:07:30',
    cantidad: 6,
    sede: 'PRINCIPAL',
    lote: 'L-SUE24-07'
  },
  {
    id: 8,
    producto: 'Bismutol Suspensión 150ml - Bagó',
    movimiento: 'Venta B001-92 (Pack de 6)',
    tipoMovimiento: 'VENTA',
    fecha: '02/11/2026 19:06:26',
    cantidad: 6,
    sede: 'PRINCIPAL',
    lote: 'L-BIS24-09'
  },
  {
    id: 9,
    producto: 'Mascarillas Quirúrgicas 3 pliegues Caja x 50',
    movimiento: 'Venta B001-90',
    tipoMovimiento: 'VENTA',
    fecha: '02/11/2026 19:00:13',
    cantidad: 1,
    sede: 'PRINCIPAL',
    lote: 'L-MAS24-15'
  },
  {
    id: 10,
    producto: 'Omeprazol 20mg Cápsulas - Farmaindustria',
    movimiento: 'Compra C001-12 (Ingreso Droguería)',
    tipoMovimiento: 'COMPRA',
    fecha: '02/11/2026 16:30:00',
    cantidad: 50,
    sede: 'PRINCIPAL',
    lote: 'L-OMP24-20'
  },
  {
    id: 11,
    producto: 'Amoxicilina 500mg Cápsulas - Medifarma',
    movimiento: 'Ajuste Ingreso (+20 Físico)',
    tipoMovimiento: 'AJUSTE',
    fecha: '01/11/2026 10:15:00',
    cantidad: 20,
    sede: 'PRINCIPAL',
    lote: 'L-AMX24-02'
  },
  {
    id: 12,
    producto: 'Paracetamol 500mg Tabletas - Genfar',
    movimiento: 'Transferencia Sede San Miguel -> Sede 2',
    tipoMovimiento: 'TRANSFERENCIA',
    fecha: '01/11/2026 09:00:00',
    cantidad: 15,
    sede: 'SUCURSAL_2',
    lote: 'L-PAR24-01'
  }
];

export default function InventarioPage() {
  const [movimientos, setMovimientos] = useState<MovimientoItem[]>(INITIAL_MOVIMIENTOS);
  const [search, setSearch] = useState('');
  const [fechaInicio, setFechaInicio] = useState('2026-11-01');
  const [fechaFin, setFechaFin] = useState('2026-11-04');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modales
  const [modalAjusteOpen, setModalAjusteOpen] = useState(false);
  const [modalTransOpen, setModalTransOpen] = useState(false);
  const [notif, setNotif] = useState<string | null>(null);

  // Form Ajuste
  const [ajusteProducto, setAjusteProducto] = useState('Paracetamol 500mg Tabletas - Genfar');
  const [ajusteLote, setAjusteLote] = useState('L-PAR24-01');
  const [ajusteTipo, setAjusteTipo] = useState<'INGRESO' | 'SALIDA'>('INGRESO');
  const [ajusteCantidad, setAjusteCantidad] = useState(10);
  const [ajusteMotivo, setAjusteMotivo] = useState('Conteo físico de inventario');
  const [ajusteRef, setAjusteRef] = useState('AJU-2026-001');

  // Form Transferencia
  const [transOrigen, setTransOrigen] = useState('Sede Principal - San Miguel');
  const [transDestino, setTransDestino] = useState('Sucursal 2 - Jesús María');
  const [transProducto, setTransProducto] = useState('Paracetamol 500mg Tabletas - Genfar');
  const [transCantidad, setTransCantidad] = useState(10);

  // Cargar movimientos del backend si están disponibles
  useEffect(() => {
    fetch('/api/inventario/movimientos')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          const mapped: MovimientoItem[] = data.map((m: any, idx: number) => ({
            id: m.id || idx + 1,
            producto: m.productoNombre || 'Medicamento',
            movimiento: m.referencia || `${m.tipo || 'MOVIMIENTO'} #${m.id}`,
            tipoMovimiento: (m.tipo as any) || 'AJUSTE',
            fecha: m.fecha ? new Date(m.fecha).toLocaleString('es-PE') : '04/11/2026 12:00:00',
            cantidad: m.cantidad || 1,
            sede: 'PRINCIPAL',
            lote: m.numeroLote || 'L-GENERAL'
          }));
          setMovimientos((prev) => [...mapped, ...prev]);
        }
      })
      .catch(() => {
        // Usar datos iniciales
      });
  }, []);

  // Notificación flash
  function showNotif(msg: string) {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3500);
  }

  // Filtrado
  const filtered = useMemo(() => {
    return movimientos.filter((m) => {
      const matchSearch =
        search.trim() === '' ||
        m.producto.toLowerCase().includes(search.toLowerCase()) ||
        m.movimiento.toLowerCase().includes(search.toLowerCase()) ||
        m.lote.toLowerCase().includes(search.toLowerCase());

      return matchSearch;
    });
  }, [movimientos, search]);

  // Paginación
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Guardar ajuste
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
      sede: 'PRINCIPAL',
      lote: ajusteLote
    };

    try {
      await fetch('/api/inventario/ajuste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loteId: 1,
          cantidad: qtyFinal,
          motivo: ajusteMotivo,
          referencia: ajusteRef
        })
      });
    } catch {
      // Ignorar fallback local
    }

    setMovimientos((prev) => [nuevoMov, ...prev]);
    setModalAjusteOpen(false);
    showNotif(`Ajuste de inventario ${ajusteRef} registrado exitosamente.`);
  }

  // Guardar transferencia
  function handleGuardarTransferencia(e: React.FormEvent) {
    e.preventDefault();
    const nuevoMov: MovimientoItem = {
      id: Date.now(),
      producto: transProducto,
      movimiento: `Transferencia ${transOrigen.split('-')[0].trim()} -> ${transDestino.split('-')[0].trim()}`,
      tipoMovimiento: 'TRANSFERENCIA',
      fecha: new Date().toLocaleString('es-PE'),
      cantidad: transCantidad,
      sede: 'PRINCIPAL',
      lote: 'L-PAR24-01'
    };

    setMovimientos((prev) => [nuevoMov, ...prev]);
    setModalTransOpen(false);
    showNotif(`Transferencia de ${transCantidad} unidades enviada a ${transDestino}.`);
  }

  // Exportar Excel (CSV)
  function exportExcel() {
    const headers = ['#', 'PRODUCTO', 'MOVIMIENTO', 'FECHA', 'CANTIDAD', 'LOTE'];
    const rows = filtered.map((m, idx) => [
      idx + 1,
      `"${m.producto}"`,
      `"${m.movimiento}"`,
      `"${m.fecha}"`,
      m.cantidad,
      `"${m.lote}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventario_novasalud_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotif('Reporte de inventario exportado en formato Excel (CSV).');
  }

  // Exportar PDF / Imprimir
  function exportPdf() {
    window.print();
  }

  return (
    <div className="inv-page">
      {/* 1. Subheader bar horizontal como el Dashboard */}
      <div className="inv-bar">
        <h1 className="inv-bar-title">
          <Boxes size={15} strokeWidth={2.2} /> INVENTARIO
        </h1>
        <div className="inv-actions">
          <Link to="/ventas?tipo=FACTURA" className="inv-dash-btn">
            <FileText size={12} strokeWidth={2} /> EMITIR FACTURA
          </Link>
          <Link to="/ventas?tipo=BOLETA" className="inv-dash-btn">
            <Receipt size={12} strokeWidth={2} /> EMITIR BOLETA
          </Link>
          <Link to="/ventas?tipo=NOTA_VENTA" className="inv-dash-btn">
            <ClipboardList size={12} strokeWidth={2} /> NOTA DE VENTA
          </Link>
        </div>
      </div>

      {/* Notificación flash */}
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
      <div className="inv-card">
        {/* Header Row: Title + Action buttons */}
        <div className="inv-header-row">
          <h2 className="inv-title">Administración de Inventario</h2>
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

        {/* Filters */}
        <div className="inv-filters-grid">
          {/* Row 1: Date pickers */}
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

          {/* Row 2: Limit & Search */}
          <div className="inv-controls-row">
            <select
              className="inv-select-limit"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              title="Registros por página"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>

            <div className="inv-search-wrap">
              <input
                type="text"
                className="inv-search-input"
                placeholder="BUSCAR POR NOMBRE O CÓDIGO DE BARRA"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <Search size={16} className="inv-search-icon" />
            </div>
          </div>
        </div>

        {/* Floating Export Toolbar */}
        <div className="inv-export-toolbar">
          <button
            type="button"
            className="btn-export btn-export-pdf"
            onClick={exportPdf}
            title="Exportar a PDF / Imprimir kardex"
          >
            <FileText size={15} />
          </button>
          <button
            type="button"
            className="btn-export btn-export-excel"
            onClick={exportExcel}
            title="Descargar reporte en Excel (.CSV)"
          >
            <FileSpreadsheet size={15} />
          </button>
          <button
            type="button"
            className="btn-export btn-export-config"
            onClick={() => {
              setSearch('');
              showNotif('Filtros restaurados correctamente.');
            }}
            title="Restablecer filtros"
          >
            <Settings size={15} />
          </button>
        </div>

        {/* 3. Movements Table */}
        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th style={{ width: 44 }}>#</th>
                <th>PRODUCTO</th>
                <th style={{ width: 280 }}>MOVIMIENTO</th>
                <th style={{ width: 170 }}>FECHA</th>
                <th style={{ width: 100, textAlign: 'right', paddingRight: 20 }}>CANTIDAD</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="inv-empty">
                    No se encontraron movimientos de inventario que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                paginated.map((item, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={item.id}>
                      <td className="inv-td-num">{globalIdx}</td>
                      <td className="inv-td-product">
                        <div>{item.producto}</div>
                        <span style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>
                          Lote: {item.lote}
                        </span>
                      </td>
                      <td className="inv-td-mov">
                        <span
                          className={`badge-mov ${
                            item.tipoMovimiento === 'VENTA'
                              ? 'badge-mov-venta'
                              : item.tipoMovimiento === 'COMPRA'
                              ? 'badge-mov-compra'
                              : item.tipoMovimiento === 'AJUSTE'
                              ? 'badge-mov-ajuste'
                              : 'badge-mov-trans'
                          }`}
                        >
                          {item.movimiento}
                        </span>
                      </td>
                      <td className="inv-td-date">{item.fecha}</td>
                      <td className="inv-td-qty">{item.cantidad}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Pagination */}
        <div className="inv-pagination">
          <span>
            Mostrando {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} a{' '}
            {Math.min(currentPage * pageSize, filtered.length)} de {filtered.length} movimientos
          </span>
          <div className="inv-page-btns">
            <button
              type="button"
              className="inv-btn-nav"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              if (totalPages > 6 && Math.abs(currentPage - p) > 2 && p !== 1 && p !== totalPages) {
                return null;
              }
              return (
                <button
                  key={p}
                  type="button"
                  className={`inv-btn-nav ${currentPage === p ? 'active' : ''}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              );
            })}
            <button
              type="button"
              className="inv-btn-nav"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODAL AJUSTE DE INVENTARIO ================= */}
      {modalAjusteOpen && (
        <div className="inv-modal-backdrop" onClick={() => setModalAjusteOpen(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3 className="inv-modal-title">
                <Plus size={16} /> Ajuste de Inventario
              </h3>
              <button
                type="button"
                className="inv-modal-close"
                onClick={() => setModalAjusteOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleGuardarAjuste}>
              <div className="inv-modal-body">
                <div className="inv-form-group">
                  <label>Producto</label>
                  <select
                    value={ajusteProducto}
                    onChange={(e) => setAjusteProducto(e.target.value)}
                  >
                    <option value="Paracetamol 500mg Tabletas - Genfar">
                      Paracetamol 500mg Tabletas - Genfar
                    </option>
                    <option value="Amoxicilina 500mg Cápsulas - Medifarma">
                      Amoxicilina 500mg Cápsulas - Medifarma
                    </option>
                    <option value="Ibuprofeno 400mg Tabletas - Farmaindustria">
                      Ibuprofeno 400mg Tabletas - Farmaindustria
                    </option>
                    <option value="Azitromicina 500mg Caja x 3 - Lab Portugal">
                      Azitromicina 500mg Caja x 3 - Lab Portugal
                    </option>
                    <option value="Alcohol Medicinal 70° 1 Litro - Alkofarma">
                      Alcohol Medicinal 70° 1 Litro - Alkofarma
                    </option>
                  </select>
                </div>

                <div className="inv-form-group">
                  <label>Número de Lote</label>
                  <input
                    type="text"
                    required
                    value={ajusteLote}
                    onChange={(e) => setAjusteLote(e.target.value)}
                    placeholder="Ej. L-PAR24-01"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="inv-form-group">
                    <label>Tipo de Ajuste</label>
                    <select
                      value={ajusteTipo}
                      onChange={(e) => setAjusteTipo(e.target.value as any)}
                    >
                      <option value="INGRESO">Ingreso (+)</option>
                      <option value="SALIDA">Salida / Merma (-)</option>
                    </select>
                  </div>
                  <div className="inv-form-group">
                    <label>Cantidad</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={ajusteCantidad}
                      onChange={(e) => setAjusteCantidad(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="inv-form-group">
                  <label>Motivo</label>
                  <select
                    value={ajusteMotivo}
                    onChange={(e) => setAjusteMotivo(e.target.value)}
                  >
                    <option value="Conteo físico de inventario">Conteo físico de inventario</option>
                    <option value="Producto dañado o merma">Producto dañado o merma</option>
                    <option value="Vencimiento de lote">Vencimiento de lote</option>
                    <option value="Corrección por error de ingreso">Corrección por error de ingreso</option>
                  </select>
                </div>

                <div className="inv-form-group">
                  <label>Referencia / Documento</label>
                  <input
                    type="text"
                    required
                    value={ajusteRef}
                    onChange={(e) => setAjusteRef(e.target.value)}
                    placeholder="Ej. AJU-2026-001"
                  />
                </div>
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

      {/* ================= MODAL TRANSFERENCIA DIRECTA ================= */}
      {modalTransOpen && (
        <div className="inv-modal-backdrop" onClick={() => setModalTransOpen(false)}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inv-modal-header">
              <h3 className="inv-modal-title">
                <ArrowLeftRight size={16} /> Transferencia entre Sedes
              </h3>
              <button
                type="button"
                className="inv-modal-close"
                onClick={() => setModalTransOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleGuardarTransferencia}>
              <div className="inv-modal-body">
                <div className="inv-form-group">
                  <label>Sede Origen</label>
                  <select
                    value={transOrigen}
                    onChange={(e) => setTransOrigen(e.target.value)}
                  >
                    <option value="Sede Principal - San Miguel">
                      TECHMULTISER PRINCIPAL - San Miguel
                    </option>
                    <option value="Sucursal 2 - Jesús María">
                      BOTICA NOVA SALUD - Sucursal 2 (Jesús María)
                    </option>
                  </select>
                </div>

                <div className="inv-form-group">
                  <label>Sede Destino</label>
                  <select
                    value={transDestino}
                    onChange={(e) => setTransDestino(e.target.value)}
                  >
                    <option value="Sucursal 2 - Jesús María">
                      BOTICA NOVA SALUD - Sucursal 2 (Jesús María)
                    </option>
                    <option value="Sede Principal - San Miguel">
                      TECHMULTISER PRINCIPAL - San Miguel
                    </option>
                  </select>
                </div>

                <div className="inv-form-group">
                  <label>Producto a Transferir</label>
                  <select
                    value={transProducto}
                    onChange={(e) => setTransProducto(e.target.value)}
                  >
                    <option value="Paracetamol 500mg Tabletas - Genfar">
                      Paracetamol 500mg Tabletas - Genfar (Disp: 140 un.)
                    </option>
                    <option value="Amoxicilina 500mg Cápsulas - Medifarma">
                      Amoxicilina 500mg Cápsulas - Medifarma (Disp: 85 un.)
                    </option>
                    <option value="Ibuprofeno 400mg Tabletas - Farmaindustria">
                      Ibuprofeno 400mg Tabletas - Farmaindustria (Disp: 120 un.)
                    </option>
                    <option value="Azitromicina 500mg Caja x 3 - Lab Portugal">
                      Azitromicina 500mg Caja x 3 - Lab Portugal (Disp: 45 un.)
                    </option>
                  </select>
                </div>

                <div className="inv-form-group">
                  <label>Cantidad a Enviar</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={transCantidad}
                    onChange={(e) => setTransCantidad(Number(e.target.value))}
                  />
                </div>
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
                  Confirmar Transferencia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
