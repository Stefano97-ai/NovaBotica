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

interface ComprobanteItemDetail {
  producto: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

interface ComprobanteItem {
  id: number;
  ventaId?: number;
  tipo: string;
  serie: string;
  correlativo: number;
  estado: string;
  clienteNombre: string;
  clienteDoc: string;
  vendedor?: string;
  fecha: string;
  subtotal?: number;
  impuesto?: number;
  total: number;
  items?: ComprobanteItemDetail[];
}

function TicketPaper({ comp }: { comp: ComprobanteItem }) {
  const isFactura = comp.tipo.toUpperCase().includes('FACTURA');
  const docTitulo = isFactura ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA';
  const cleanDocNum = comp.clienteDoc.replace(/^(DNI|RUC)\s*/i, '');
  const subtotal = comp.subtotal ?? (comp.total / 1.18);
  const impuesto = comp.impuesto ?? (comp.total - subtotal);

  return (
    <div className="ticket-paper">
      <div className="ticket-header">
        <div className="ticket-brand">BOTICA NOVA SALUD</div>
        <div className="ticket-company">NOVA SALUD S.A.C.</div>
        <div className="ticket-ruc">R.U.C. 20608945612</div>
        <div className="ticket-address">Av. Los Rosales 450 - San Borja, Lima</div>
        <div className="ticket-phone">Teléf: (01) 456-7890 / 987 654 321</div>
      </div>

      <div className="ticket-divider" />

      <div className="ticket-doc-type">
        <span className="ticket-doc-title">{docTitulo}</span>
        <span className="ticket-doc-number">
          {comp.serie}-{String(comp.correlativo).padStart(8, '0')}
        </span>
      </div>

      <div className="ticket-divider" />

      <div className="ticket-data-grid">
        <div className="ticket-data-row">
          <span className="ticket-data-label">Fecha de Emisión:</span>
          <span className="ticket-data-val">{comp.fecha}</span>
        </div>
        <div className="ticket-data-row">
          <span className="ticket-data-label">N° Operación:</span>
          <span className="ticket-data-val">#{comp.ventaId || comp.id}</span>
        </div>
        <div className="ticket-data-row">
          <span className="ticket-data-label">Cajero/Vendedor:</span>
          <span className="ticket-data-val">{comp.vendedor || 'Administrador'}</span>
        </div>
        <div className="ticket-data-row">
          <span className="ticket-data-label">Cliente / Receptor:</span>
          <span className="ticket-data-val">{comp.clienteNombre}</span>
        </div>
        <div className="ticket-data-row">
          <span className="ticket-data-label">{isFactura ? 'R.U.C.' : 'D.N.I.'}:</span>
          <span className="ticket-data-val">{cleanDocNum || '00000000'}</span>
        </div>
        <div className="ticket-data-row">
          <span className="ticket-data-label">Moneda:</span>
          <span className="ticket-data-val">SOLES (PEN)</span>
        </div>
      </div>

      <div className="ticket-divider" />

      <table className="ticket-items-table">
        <thead>
          <tr>
            <th className="ticket-col-cant">CANT</th>
            <th className="ticket-col-desc">DESCRIPCIÓN</th>
            <th className="ticket-col-pu">P.U.</th>
            <th className="ticket-col-tot">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {comp.items && comp.items.length > 0 ? (
            comp.items.map((it, idx) => (
              <tr key={idx}>
                <td className="ticket-col-cant">{it.cantidad}</td>
                <td className="ticket-col-desc">{it.producto}</td>
                <td className="ticket-col-pu">{Number(it.precioUnitario).toFixed(2)}</td>
                <td className="ticket-col-tot">{Number(it.total).toFixed(2)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="ticket-col-cant">1</td>
              <td className="ticket-col-desc">PRODUCTOS FARMACÉUTICOS VARIOS</td>
              <td className="ticket-col-pu">{Number(comp.total).toFixed(2)}</td>
              <td className="ticket-col-tot">{Number(comp.total).toFixed(2)}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="ticket-divider" />

      <div className="ticket-totals-box">
        <div className="ticket-total-row">
          <span>OP. GRAVADA:</span>
          <span>S/ {subtotal.toFixed(2)}</span>
        </div>
        <div className="ticket-total-row">
          <span>I.G.V. (18%):</span>
          <span>S/ {impuesto.toFixed(2)}</span>
        </div>
        <div className="ticket-total-row ticket-total-main">
          <span>TOTAL A PAGAR:</span>
          <span>S/ {Number(comp.total).toFixed(2)}</span>
        </div>
      </div>

      <div className="ticket-divider" />

      <div className="ticket-footer">
        <p>Representación impresa de la {isFactura ? 'Factura' : 'Boleta'} de Venta Electrónica.</p>
        <p>HASH: 4b29e06917f8a32cd801</p>
        <p>Autorizado mediante Resolución de Superintendencia SUNAT</p>
        <div className="ticket-qr-sim">
          <div>[ QR SUNAT ]</div>
          <div style={{ fontSize: 7, marginTop: 2 }}>{comp.serie}-{String(comp.correlativo).padStart(8, '0')}</div>
        </div>
        <p className="ticket-thanks">¡GRACIAS POR SU COMPRA!</p>
        <p>Nova Salud · Cuidamos de su salud y bienestar</p>
      </div>
    </div>
  );
}

export default function ComprobantesPage() {
  const [tipoComprobante, setTipoComprobante] = useState('FACTURA');
  const [serie, setSerie] = useState('F001');
  const [correlativo, setCorrelativo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState<ComprobanteItem | null>(null);
  const [sinResultados, setSinResultados] = useState(false);
  const [recientes, setRecientes] = useState<any[]>([]);
  const [showTicketModal, setShowTicketModal] = useState(false);

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

    let parsedDoc: any = {};
    try {
      if (typeof comp.datosDocumento === 'string') {
        parsedDoc = JSON.parse(comp.datosDocumento);
      } else if (comp.datosDocumento && typeof comp.datosDocumento === 'object') {
        parsedDoc = comp.datosDocumento;
      }
    } catch {
      parsedDoc = {};
    }

    const rawNumDoc = comp.clienteNumeroDoc || parsedDoc.cliente?.numeroDocumento || '';
    const rawTipoDoc = comp.clienteTipoDoc || parsedDoc.cliente?.tipoDocumento || 'DNI';
    const clienteNombre = comp.clienteNombre || parsedDoc.cliente?.nombre || 'CLIENTES VARIOS';
    let clienteDoc = '';
    if (rawNumDoc && rawNumDoc !== '00000000' && rawNumDoc !== '-') {
      clienteDoc = `${rawTipoDoc} ${rawNumDoc}`;
    } else {
      clienteDoc = 'DNI 00000000';
    }

    let items: ComprobanteItemDetail[] = [];
    if (Array.isArray(parsedDoc.items)) {
      items = parsedDoc.items.map((it: any) => ({
        producto: String(it.producto || 'Producto farmacéutico'),
        cantidad: Number(it.cantidad || 1),
        precioUnitario: Number(it.precioUnitario || 0),
        total: Number(it.total || 0),
      }));
    }

    const totalVal = Number(comp.total) || (typeof parsedDoc.total === 'number' ? parsedDoc.total : 0);
    const subtotalVal = typeof parsedDoc.subtotal === 'number' ? parsedDoc.subtotal : (totalVal / 1.18);
    const impuestoVal = typeof parsedDoc.impuesto === 'number' ? parsedDoc.impuesto : (totalVal - subtotalVal);
    const vendedorVal = typeof parsedDoc.vendedor === 'string' ? parsedDoc.vendedor : 'Administrador';

    setResultado({
      id: comp.id,
      ventaId: comp.ventaId,
      tipo: comp.tipoNombre || (comp.tipoCodigo === 'FACTURA' ? 'FACTURA' : 'BOLETA'),
      serie: comp.serie || 'B001',
      correlativo: comp.correlativo || 1,
      estado: comp.estado || 'ACEPTADO POR SUNAT',
      clienteNombre,
      clienteDoc,
      vendedor: vendedorVal,
      fecha: comp.creadoEn ? new Date(comp.creadoEn).toLocaleString('es-PE') : new Date().toLocaleString('es-PE'),
      total: totalVal,
      subtotal: subtotalVal,
      impuesto: impuestoVal,
      items,
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

        let items: ComprobanteItemDetail[] = [];
        if (Array.isArray(parsedDoc.items)) {
          items = parsedDoc.items.map((it: any) => ({
            producto: String(it.producto || 'Producto farmacéutico'),
            cantidad: Number(it.cantidad || 1),
            precioUnitario: Number(it.precioUnitario || 0),
            total: Number(it.total || 0),
          }));
        }

        const totalVal =
          typeof match.total === 'number'
            ? match.total
            : typeof parsedDoc.total === 'number'
            ? parsedDoc.total
            : 0;
        const subtotalVal = typeof parsedDoc.subtotal === 'number' ? parsedDoc.subtotal : (totalVal / 1.18);
        const impuestoVal = typeof parsedDoc.impuesto === 'number' ? parsedDoc.impuesto : (totalVal - subtotalVal);
        const vendedorVal = typeof parsedDoc.vendedor === 'string' ? parsedDoc.vendedor : 'Administrador';

        setResultado({
          id: match.id,
          ventaId: match.ventaId,
          tipo: match.tipoNombre || (match.tipoCodigo === 'FACTURA' ? 'FACTURA' : 'BOLETA'),
          serie: match.serie || serieTrimmed,
          correlativo: match.correlativo || corrNum,
          estado: match.estado || 'ACEPTADO POR SUNAT',
          clienteNombre,
          clienteDoc,
          vendedor: vendedorVal,
          fecha: match.creadoEn ? new Date(match.creadoEn).toLocaleString('es-PE') : new Date().toLocaleString('es-PE'),
          total: totalVal,
          subtotal: subtotalVal,
          impuesto: impuestoVal,
          items,
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

  async function handleDescargarPdf(comp: ComprobanteItem) {
    try {
      const { jsPDF } = await import('jspdf');
      const isFactura = comp.tipo.toUpperCase().includes('FACTURA');
      const docTitulo = isFactura ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA';
      const numDocStr = `${comp.serie}-${String(comp.correlativo).padStart(8, '0')}`;
      const itemsList = comp.items && comp.items.length > 0 ? comp.items : [
        { cantidad: 1, producto: 'PRODUCTOS FARMACÉUTICOS VARIOS', precioUnitario: comp.total, total: comp.total }
      ];

      const estHeight = Math.max(160, 130 + itemsList.length * 8);
      const doc = new jsPDF({
        unit: 'mm',
        format: [80, estHeight],
        orientation: 'portrait',
      });

      let y = 8;
      doc.setFont('courier', 'bold');
      doc.setFontSize(11);
      doc.text('NOVA SALUD S.A.C.', 40, y, { align: 'center' });
      y += 4;

      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.text('R.U.C. 20608945612', 40, y, { align: 'center' });
      y += 3.5;
      doc.text('Av. Los Rosales 450 - San Borja, Lima', 40, y, { align: 'center' });
      y += 3.5;
      doc.text('Teléf: (01) 456-7890 / 987 654 321', 40, y, { align: 'center' });
      y += 4;

      // Divider
      doc.setLineDashPattern([1, 1], 0);
      doc.setDrawColor(100, 100, 100);
      doc.line(4, y, 76, y);
      y += 4;

      // Document Type
      doc.setFont('courier', 'bold');
      doc.setFontSize(9.5);
      doc.text(docTitulo, 40, y, { align: 'center' });
      y += 4;
      doc.setFontSize(10.5);
      doc.text(numDocStr, 40, y, { align: 'center' });
      y += 3.5;

      // Divider
      doc.line(4, y, 76, y);
      y += 4;

      // Metadata
      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);

      const printRow = (label: string, value: string) => {
        doc.setFont('courier', 'normal');
        doc.text(label, 4, y);
        doc.setFont('courier', 'bold');
        const split = doc.splitTextToSize(value, 42);
        doc.text(split, 76, y, { align: 'right' });
        y += Math.max(3.6, split.length * 3.3);
      };

      printRow('Fecha:', comp.fecha);
      printRow('N° Operación:', `#${comp.ventaId || comp.id}`);
      printRow('Cajero:', comp.vendedor || 'Administrador');
      printRow('Cliente:', comp.clienteNombre || 'CLIENTES VARIOS');
      const cleanDocNum = comp.clienteDoc ? comp.clienteDoc.replace(/^(DNI|RUC)\s*/i, '').trim() : '00000000';
      printRow(isFactura ? 'R.U.C.:' : 'D.N.I.:', cleanDocNum || '00000000');
      printRow('Moneda:', 'SOLES (PEN)');

      y += 1;
      doc.line(4, y, 76, y);
      y += 4;

      // Items table header
      doc.setFont('courier', 'bold');
      doc.setFontSize(7);
      doc.text('CANT', 4, y);
      doc.text('DESCRIPCION', 14, y);
      doc.text('P.U.', 58, y, { align: 'right' });
      doc.text('TOTAL', 76, y, { align: 'right' });
      y += 3.5;
      doc.line(4, y, 76, y);
      y += 3.5;

      // Items rows
      doc.setFont('courier', 'normal');
      itemsList.forEach((it) => {
        doc.text(String(it.cantidad), 4, y);
        const descLines = doc.splitTextToSize(it.producto, 40);
        doc.text(descLines, 14, y);
        doc.text(Number(it.precioUnitario).toFixed(2), 58, y, { align: 'right' });
        doc.text(Number(it.total).toFixed(2), 76, y, { align: 'right' });
        y += Math.max(3.8, descLines.length * 3.2);
      });

      y += 1;
      doc.line(4, y, 76, y);
      y += 4;

      // Totals
      const subtotal = typeof comp.subtotal === 'number' ? comp.subtotal : (comp.total / 1.18);
      const impuesto = typeof comp.impuesto === 'number' ? comp.impuesto : (comp.total - subtotal);

      doc.setFont('courier', 'normal');
      doc.setFontSize(7.5);
      doc.text('OP. GRAVADA:', 28, y);
      doc.text(`S/ ${subtotal.toFixed(2)}`, 76, y, { align: 'right' });
      y += 3.8;
      doc.text('I.G.V. (18%):', 28, y);
      doc.text(`S/ ${impuesto.toFixed(2)}`, 76, y, { align: 'right' });
      y += 4.2;

      doc.setFont('courier', 'bold');
      doc.setFontSize(8.5);
      doc.text('TOTAL A PAGAR:', 24, y);
      doc.text(`S/ ${Number(comp.total).toFixed(2)}`, 76, y, { align: 'right' });
      y += 4.5;

      doc.line(4, y, 76, y);
      y += 4.5;

      // Footer
      doc.setFont('courier', 'normal');
      doc.setFontSize(6.5);
      doc.text(`Representación impresa de la ${isFactura ? 'Factura' : 'Boleta'} Electrónica`, 40, y, { align: 'center' });
      y += 3.2;
      doc.text('HASH: 4b29e06917f8a32cd801', 40, y, { align: 'center' });
      y += 3.2;
      doc.text('Autorizado mediante Res. Superintendencia SUNAT', 40, y, { align: 'center' });
      y += 4.5;

      // QR box
      doc.setLineDashPattern([], 0);
      doc.rect(28, y, 24, 13);
      doc.setFontSize(6);
      doc.text('[ QR SUNAT ]', 40, y + 5.5, { align: 'center' });
      doc.text(numDocStr, 40, y + 9.5, { align: 'center' });
      y += 16;

      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.text('¡GRACIAS POR SU COMPRA!', 40, y, { align: 'center' });
      y += 3.5;
      doc.setFont('courier', 'normal');
      doc.setFontSize(6.5);
      doc.text('Nova Salud · Cuidamos de su salud y bienestar', 40, y, { align: 'center' });

      doc.save(`${numDocStr}.pdf`);
    } catch (err) {
      console.error('Error generando PDF:', err);
      window.print();
    }
  }

  function handleDescargarXml(comp: ComprobanteItem) {
    const numDocStr = `${comp.serie}-${String(comp.correlativo).padStart(8, '0')}`;
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Comprobante Electrónico Homologado SUNAT UBL 2.1 -->
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <ID>${numDocStr}</ID>
  <IssueDate>${new Date().toISOString().slice(0, 10)}</IssueDate>
  <DocumentCurrencyCode>PEN</DocumentCurrencyCode>
  <AccountingSupplierParty>
    <Party>
      <PartyIdentification><ID>20608945612</ID></PartyIdentification>
      <PartyLegalEntity><RegistrationName>NOVA SALUD S.A.C.</RegistrationName></PartyLegalEntity>
    </Party>
  </AccountingSupplierParty>
  <AccountingCustomerParty>
    <Party>
      <PartyIdentification><ID>${comp.clienteDoc || '00000000'}</ID></PartyIdentification>
      <PartyLegalEntity><RegistrationName>${comp.clienteNombre || 'CLIENTES VARIOS'}</RegistrationName></PartyLegalEntity>
    </Party>
  </AccountingCustomerParty>
  <LegalMonetaryTotal>
    <PayableAmount currencyID="PEN">${Number(comp.total).toFixed(2)}</PayableAmount>
  </LegalMonetaryTotal>
</Invoice>`;
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `20608945612-${numDocStr}.xml`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
                onClick={() => setShowTicketModal(true)}
              >
                <FaFileInvoice size={12} /> Vista Previa Ticket
              </button>
              <button
                type="button"
                className="consult-act-btn consult-act-download"
                onClick={() => handleDescargarPdf(resultado)}
              >
                <FaDownload size={12} /> Descargar PDF
              </button>
              <button
                type="button"
                className="consult-act-btn consult-act-download"
                onClick={() => handleDescargarXml(resultado)}
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

      {/* Ticket formal que se imprime exclusivamente al presionar window.print() */}
      {resultado && (
        <div className="ticket-print-only">
          <TicketPaper comp={resultado} />
        </div>
      )}

      {/* Modal de vista previa en pantalla */}
      {showTicketModal && resultado && (
        <div className="ticket-screen-preview-modal" onClick={() => setShowTicketModal(false)}>
          <div className="ticket-preview-box" onClick={(e) => e.stopPropagation()}>
            <div className="ticket-preview-header">
              <h4>Vista Previa del Comprobante (Ticket 80mm)</h4>
              <button type="button" className="ticket-preview-close" onClick={() => setShowTicketModal(false)}>
                ×
              </button>
            </div>
            <div style={{ padding: '12px 16px', overflowY: 'auto', background: '#e2e8f0' }}>
              <TicketPaper comp={resultado} />
            </div>
            <div className="ticket-preview-actions">
              <button
                type="button"
                className="consult-act-btn consult-act-download"
                onClick={() => setShowTicketModal(false)}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="consult-act-btn consult-act-download"
                onClick={() => handleDescargarPdf(resultado)}
              >
                <FaDownload size={12} /> Descargar PDF
              </button>
              <button
                type="button"
                className="consult-act-btn consult-act-print"
                onClick={() => {
                  setShowTicketModal(false);
                  setTimeout(() => window.print(), 150);
                }}
              >
                <FaPrint size={12} /> Imprimir Ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
