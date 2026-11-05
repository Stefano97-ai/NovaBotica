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

  // Auto-update serie based on tipo
  function handleTipoChange(nuevoTipo: string) {
    setTipoComprobante(nuevoTipo);
    if (nuevoTipo === 'FACTURA') setSerie('F001');
    else if (nuevoTipo === 'BOLETA') setSerie('B001');
    else setSerie('NV001');
  }

  async function handleConsultar(e: React.FormEvent) {
    e.preventDefault();
    const corrTrimmed = correlativo.trim();
    if (!corrTrimmed) {
      setSinResultados(true);
      setResultado(null);
      return;
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

    const serieTrimmed = serie.trim().toUpperCase();

    try {
      const res = await fetch(`/api/comprobantes?serie=${encodeURIComponent(serieTrimmed)}&correlativo=${corrNum}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [data];
        const match = list.find(
          (c: any) =>
            c &&
            c.serie?.toUpperCase() === serieTrimmed &&
            Number(c.correlativo) === corrNum
        );
        if (match) {
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
            (tipoComprobante === 'FACTURA' ? 'RUC' : 'DNI');
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
            tipo: match.tipoNombre || tipoComprobante,
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
                <span className="consult-info-label">Moneda</span>
                <span className="consult-info-val">SOLES (PEN)</span>
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
      </section>
    </div>
  );
}
