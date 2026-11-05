import { useState, useEffect } from 'react';
import {
  FaFileInvoiceDollar,
  FaFileInvoice,
  FaBarcode,
  FaHashtag,
  FaMagnifyingGlass,
  FaPrint,
  FaDownload,
  FaCircleCheck,
  FaCircleExclamation
} from 'react-icons/fa6';
import './comprobantes.css';

interface ComprobanteItem {
  id: number;
  ventaId?: number;
  tipo: string;
  serie: string;
  correlativo: number;
  estado: string;
  clienteNombre: string;
  clienteDoc: string;
  fecha: string;
  total: number;
}

export default function ComprobantesPage() {
  const [tipoComprobante, setTipoComprobante] = useState('FACTURA');
  const [serie, setSerie] = useState('F001');
  const [correlativo, setCorrelativo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState<ComprobanteItem | null>(null);
  const [sinResultados, setSinResultados] = useState(false);
  const [recientes, setRecientes] = useState<any[]>([]);

  // Load latest emitted receipts for instant navigation
  useEffect(() => {
    fetch('/api/comprobantes')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        if (Array.isArray(d)) setRecientes(d.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  function handleSelectReciente(comp: any) {
    if (comp.tipoCodigo === 'FACTURA') setTipoComprobante('FACTURA');
    else if (comp.tipoCodigo === 'BOLETA') setTipoComprobante('BOLETA');
    else setTipoComprobante('NOTA DE VENTA');

    setSerie(comp.serie || 'B001');
    setCorrelativo(String(comp.correlativo));

    const rawNumDoc = comp.clienteNumeroDoc || '';
    const rawTipoDoc = comp.clienteTipoDoc || 'DNI';
    const clienteNombre = comp.clienteNombre || 'CLIENTES VARIOS';
    let clienteDoc = '';
    if (rawNumDoc && rawNumDoc !== '00000000' && rawNumDoc !== '-') {
      clienteDoc = `${rawTipoDoc} ${rawNumDoc}`;
    } else {
      clienteDoc = 'DNI 00000000';
    }

    setResultado({
      id: comp.id,
      ventaId: comp.ventaId,
      tipo: comp.tipoNombre || 'BOLETA',
      serie: comp.serie || 'B001',
      correlativo: comp.correlativo || 1,
      estado: comp.estado || 'ACEPTADO POR SUNAT',
      clienteNombre,
      clienteDoc,
      fecha: comp.creadoEn ? new Date(comp.creadoEn).toLocaleString('es-PE') : new Date().toLocaleString('es-PE'),
      total: Number(comp.total) || 0,
    });
    setSinResultados(false);
  }

  // Auto-update serie based on tipo
  function handleTipoChange(nuevoTipo: string) {
    setTipoComprobante(nuevoTipo);
    if (nuevoTipo === 'FACTURA') setSerie('F001');
    else if (nuevoTipo === 'BOLETA') setSerie('B001');
    else setSerie('NV001');
  }

  async function handleConsultar(e: React.FormEvent) {
    e.preventDefault();
    let corrTrimmed = correlativo.trim();
    if (!corrTrimmed) {
      setSinResultados(true);
      setResultado(null);
      return;
    }

    let serieTrimmed = serie.trim().toUpperCase();

    // Support entering formats like "#793", "B001-00000793", "B001-793"
    if (corrTrimmed.startsWith('#')) {
      corrTrimmed = corrTrimmed.slice(1).trim();
    }
    if (corrTrimmed.includes('-')) {
      const parts = corrTrimmed.split('-');
      if (parts.length === 2) {
        if (parts[0].trim()) {
          serieTrimmed = parts[0].trim().toUpperCase();
          setSerie(serieTrimmed);
        }
        corrTrimmed = parts[1].trim();
      }
    }

    const corrNum = parseInt(corrTrimmed, 10);
    if (isNaN(corrNum) || corrNum <= 0) {
      setSinResultados(true);
      setResultado(null);
      return;
    }

    setBuscando(true);
    setSinResultados(false);
    setResultado(null);

    try {
      // 1. Intentar con la serie seleccionada
      let res = await fetch(`/api/comprobantes?serie=${encodeURIComponent(serieTrimmed)}&correlativo=${corrNum}`);
      let data = res.ok ? await res.json() : [];
      let list = Array.isArray(data) ? data : [data];
      let match =
        list.find(
          (c: any) =>
            c && (
              Number(c.correlativo) === corrNum ||
              Number(c.ventaId) === corrNum ||
              Number(c.id) === corrNum
            )
        ) || (list.length === 1 ? list[0] : null);

      // 2. Si no coincide con esa serie (p. ej. eligió FACTURA pero era BOLETA o viceversa), buscar sin filtro de serie
      if (!match) {
        res = await fetch(`/api/comprobantes?correlativo=${corrNum}`);
        if (res.ok) {
          data = await res.json();
          list = Array.isArray(data) ? data : [data];
          match =
            list.find(
              (c: any) =>
                c && (
                  Number(c.correlativo) === corrNum ||
                  Number(c.ventaId) === corrNum ||
                  Number(c.id) === corrNum
                )
            ) || (list.length === 1 ? list[0] : null);
        }
      }

      // 3. Si aún no hay match, consultar la lista completa y filtrar del lado cliente
      if (!match) {
        res = await fetch('/api/comprobantes');
        if (res.ok) {
          data = await res.json();
          if (Array.isArray(data)) {
            match = data.find(
              (c: any) =>
                c && (
                  Number(c.correlativo) === corrNum ||
                  Number(c.ventaId) === corrNum ||
                  Number(c.id) === corrNum
                )
            );
          }
        }
      }

      if (match) {
        // Sincronizar automáticamente el tipo y serie con el comprobante encontrado
        if (match.tipoCodigo === 'FACTURA') {
          setTipoComprobante('FACTURA');
          setSerie(match.serie || 'F001');
        } else if (match.tipoCodigo === 'BOLETA') {
          setTipoComprobante('BOLETA');
          setSerie(match.serie || 'B001');
        } else {
          setTipoComprobante('NOTA DE VENTA');
          setSerie(match.serie || 'NV001');
        }

        // Parse datosDocumento as fallback if fields are nested
        let parsedDoc: any = {};
        try {
          if (typeof match.datosDocumento === 'string') {
            parsedDoc = JSON.parse(match.datosDocumento);
          } else if (match.datosDocumento && typeof match.datosDocumento === 'object') {
            parsedDoc = match.datosDocumento;
          }
        } catch {
          parsedDoc = {};
        }

        const rawNumDoc =
          match.clienteNumeroDoc ||
          parsedDoc.cliente?.numeroDocumento ||
          parsedDoc.cliente?.numero ||
          '';
        const rawTipoDoc =
          match.clienteTipoDoc ||
          parsedDoc.cliente?.tipoDocumento ||
          (match.tipoCodigo === 'FACTURA' ? 'RUC' : 'DNI');
        const clienteNombre =
          match.clienteNombre ||
          parsedDoc.cliente?.nombre ||
          'CLIENTES VARIOS';

        let clienteDoc = '';
        if (rawNumDoc && rawNumDoc !== '00000000' && rawNumDoc !== '-') {
          clienteDoc = `${rawTipoDoc} ${rawNumDoc}`;
        } else if (rawNumDoc === '00000000' || clienteNombre.toUpperCase().includes('VARIOS')) {
          clienteDoc = 'DNI 00000000';
        } else {
          clienteDoc = '-';
        }

        const totalVal =
          typeof match.total === 'number'
            ? match.total
            : typeof parsedDoc.total === 'number'
            ? parsedDoc.total
            : 0;

        setResultado({
          id: match.id,
          ventaId: match.ventaId,
          tipo: match.tipoNombre || (match.tipoCodigo === 'FACTURA' ? 'FACTURA' : 'BOLETA'),
          serie: match.serie || serieTrimmed,
          correlativo: match.correlativo || corrNum,
          estado: match.estado || 'ACEPTADO POR SUNAT',
          clienteNombre,
          clienteDoc,
          fecha: match.creadoEn ? new Date(match.creadoEn).toLocaleString('es-PE') : new Date().toLocaleString('es-PE'),
          total: totalVal,
        });
        setSinResultados(false);
        setBuscando(false);
        return;
      }
      setSinResultados(true);
      setResultado(null);
    } catch {
      setSinResultados(true);
      setResultado(null);
    } finally {
      setBuscando(false);
    }
  }

  function handleDescargar(id: number) {
    window.open(`/api/comprobantes/${id}/descargar`, '_blank');
  }

  return (
    <div className="consult-wrap">
      {/* Top Breadcrumb pill matching screenshot */}
      <div className="consult-breadcrumb">
        <FaFileInvoiceDollar size={13} />
        <span>CONSULTAR COMPROBANTE</span>
      </div>

      {/* Main card panel */}
      <section className="consult-card">
        <h2 className="consult-title">CONSULTE EL ESTADO DE SU COMPROBANTE</h2>

        <form className="consult-form" onSubmit={handleConsultar}>
          {/* Campo 1: Tipo de comprobante */}
          <div className="consult-field">
            <label className="consult-label">TIPO DE COMPROBANTE</label>
            <div className="consult-input-wrap consult-select-wrap">
              <FaFileInvoice className="consult-input-icon" size={13} />
              <select
                className="consult-select"
                value={tipoComprobante}
                onChange={(e) => handleTipoChange(e.target.value)}
              >
                <option value="FACTURA">FACTURA</option>
                <option value="BOLETA">BOLETA</option>
                <option value="NOTA DE VENTA">NOTA DE VENTA</option>
              </select>
            </div>
          </div>

          {/* Campo 2: Serie */}
          <div className="consult-field">
            <label className="consult-label">SERIE</label>
            <div className="consult-input-wrap">
              <FaBarcode className="consult-input-icon" size={13} />
              <input
                type="text"
                className="consult-input"
                value={serie}
                onChange={(e) => setSerie(e.target.value)}
                placeholder="F001"
              />
            </div>
          </div>

          {/* Campo 3: Correlativo */}
          <div className="consult-field">
            <label className="consult-label">CORRELATIVO</label>
            <div className="consult-input-wrap">
              <FaHashtag className="consult-input-icon" size={12} />
              <input
                type="number"
                className="consult-input"
                value={correlativo}
                onChange={(e) => setCorrelativo(e.target.value)}
                placeholder="EJ. 123"
              />
            </div>
          </div>

          {/* Botón Consultar */}
          <button type="submit" className="consult-submit-btn" disabled={buscando}>
            <FaMagnifyingGlass size={13} />
            <span>{buscando ? 'CONSULTANDO...' : 'CONSULTAR'}</span>
          </button>
        </form>

        {/* Tarjeta de resultado */}
        {resultado && (
          <div className="consult-result-card">
            <div className="consult-result-header">
              <div className="consult-result-doc">
                <FaFileInvoiceDollar size={16} color="#1d68ed" />
                <span>
                  {resultado.tipo} {resultado.serie}-{String(resultado.correlativo).padStart(8, '0')}
                </span>
              </div>
              <span className="consult-status-badge status-aceptado">
                <FaCircleCheck size={11} style={{ marginRight: 4 }} />
                {resultado.estado}
              </span>
            </div>

            <div className="consult-grid-info">
              <div className="consult-info-item">
                <span className="consult-info-label">Cliente / Receptor</span>
                <span className="consult-info-val">
                  {resultado.clienteDoc && resultado.clienteDoc !== '-'
                    ? `${resultado.clienteDoc} - ${resultado.clienteNombre}`
                    : resultado.clienteNombre}
                </span>
              </div>
              <div className="consult-info-item">
                <span className="consult-info-label">Fecha de Emisión</span>
                <span className="consult-info-val">{resultado.fecha}</span>
              </div>
              <div className="consult-info-item">
                <span className="consult-info-label">N° Operación (Venta)</span>
                <span className="consult-info-val">#{resultado.ventaId || resultado.id}</span>
              </div>
              <div className="consult-info-item">
                <span className="consult-info-label">Importe Total</span>
                <span className="consult-info-val" style={{ color: '#2563eb' }}>
                  S/ {resultado.total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="consult-actions-bar">
              <button
                type="button"
                className="consult-act-btn consult-act-print"
                onClick={() => window.print()}
              >
                <FaPrint size={12} /> Imprimir Comprobante
              </button>
              <button
                type="button"
                className="consult-act-btn consult-act-download"
                onClick={() => handleDescargar(resultado.id)}
              >
                <FaDownload size={12} /> Descargar PDF / TXT
              </button>
              <button
                type="button"
                className="consult-act-btn consult-act-download"
                onClick={() => alert('Descargando archivo XML/CDR homologado por SUNAT')}
              >
                <FaDownload size={12} /> Descargar XML / CDR
              </button>
            </div>
          </div>
        )}

        {sinResultados && (
          <div className="consult-result-card" style={{ textAlign: 'center', color: '#64748b' }}>
            <FaCircleExclamation size={24} color="#f59e0b" style={{ margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
              No se encontró ningún comprobante registrado con la serie {serie} y correlativo {correlativo}.
            </p>
            <span style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginTop: 4 }}>
              Verifica que el número y serie ingresados correspondan a una venta registrada en el sistema.
            </span>
          </div>
        )}

        {/* Accesos rápidos a últimos comprobantes emitidos */}
        {recientes.length > 0 && (
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              Comprobantes emitidos recientemente en el sistema:
            </h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {recientes.map((comp) => (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => handleSelectReciente(comp)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#f8fafc')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FaFileInvoiceDollar size={15} color="#2563eb" />
                    <div>
                      <strong style={{ fontSize: 13, color: '#1e293b' }}>
                        {comp.tipoNombre || comp.tipoCodigo} {comp.serie}-{String(comp.correlativo).padStart(8, '0')}
                      </strong>
                      <span style={{ fontSize: 11.5, color: '#64748b', display: 'block' }}>
                        Venta #{comp.ventaId} · {comp.clienteNumeroDoc && comp.clienteNumeroDoc !== '00000000' && comp.clienteNumeroDoc !== '-' ? `${comp.clienteTipoDoc || 'DNI'} ${comp.clienteNumeroDoc} - ` : ''}{comp.clienteNombre || 'CLIENTES VARIOS'}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: 13, color: '#10b981' }}>
                      S/ {Number(comp.total || 0).toFixed(2)}
                    </strong>
                    <span style={{ fontSize: 11, color: '#94a3b8', display: 'block' }}>
                      {comp.creadoEn ? new Date(comp.creadoEn).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
