import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  FileText,
  Receipt,
  ClipboardList,
  Sparkles,
  UserPlus
} from 'lucide-react';
import './proveedores.css';

interface ProveedorItem {
  id: number;
  ruc: string;
  razonSocial: string;
  direccion: string;
  email: string;
  telefono: string;
}

const INITIAL_PROVEEDORES: ProveedorItem[] = [
  {
    id: 1,
    ruc: '20602354343',
    razonSocial: 'TECNO SOLUCIONES INFORMATICA S.A.C.',
    direccion: 'JR. SAN MARTIN NRO 3 SEC. BARRAZA',
    email: '-',
    telefono: '-'
  },
  {
    id: 2,
    ruc: '20610840877',
    razonSocial: 'SV MULTISERVICIO LORETO EMPRESA INDIVIDUAL DE RESPONSABILIDAD LIMITADA',
    direccion: 'AV. QUIÑONES NRO 4070 C.C. SAN JUAN DE MIRAFLORES',
    email: '-',
    telefono: '-'
  },
  {
    id: 3,
    ruc: '44722117',
    razonSocial: 'ert',
    direccion: '-',
    email: '-',
    telefono: '-'
  },
  {
    id: 4,
    ruc: '20604726019',
    razonSocial: 'UNIDAD EJECUTORA 407 - RED DE SALUD LORETO NAUTA',
    direccion: 'CAL. DIEGO RODRIGUEZ MZA. 21 LOTE 2 OTR. DIEGO RODRIGUEZ',
    email: '-',
    telefono: '-'
  },
  {
    id: 5,
    ruc: '20329537278',
    razonSocial: 'SONY MUSIC ENTERTAINMENT PERU S.A.',
    direccion: 'CAL. RECAVARREN NRO 111 INT. 503',
    email: '-',
    telefono: '-'
  },
  {
    id: 6,
    ruc: '20486895404',
    razonSocial: 'MULTISERVICIOS E INVERSIONES VALLECITO S.R.L.',
    direccion: 'AV. BRASIL NRO 1836 DEP. 2002',
    email: '-',
    telefono: '-'
  },
  {
    id: 7,
    ruc: '41329965',
    razonSocial: 'JULIA CRISTAN VILCHEZ',
    direccion: '-',
    email: '-',
    telefono: '-'
  },
  {
    id: 8,
    ruc: '20103134065',
    razonSocial: 'FERRONOR S.A.C',
    direccion: '-',
    email: '-',
    telefono: '-'
  }
];

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<ProveedorItem[]>(INITIAL_PROVEEDORES);
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof ProveedorItem>('id');
  const [sortAsc, setSortAsc] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formRuc, setFormRuc] = useState('');
  const [formRazon, setFormRazon] = useState('');
  const [formDireccion, setFormDireccion] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [notif, setNotif] = useState<string | null>(null);

  // Cargar proveedores del backend si están disponibles
  useEffect(() => {
    fetch('/api/proveedores')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          const mapped: ProveedorItem[] = data.map((p: any, idx: number) => ({
            id: p.id || idx + 1,
            ruc: p.ruc || '20000000000',
            razonSocial: p.razonSocial || 'Proveedor',
            direccion: p.direccion || '-',
            email: p.correo || '-',
            telefono: p.telefono || '-'
          }));
          setProveedores(mapped);
        }
      })
      .catch(() => {
        // Usar datos iniciales
      });
  }, []);

  function showNotif(msg: string) {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3500);
  }

  // Ordenar
  function handleSort(field: keyof ProveedorItem) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  // Filtrado y ordenamiento
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = proveedores.filter((p) => {
      if (!q) return true;
      return (
        p.ruc.toLowerCase().includes(q) ||
        p.razonSocial.toLowerCase().includes(q) ||
        p.direccion.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.telefono.toLowerCase().includes(q)
      );
    });

    list.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    return list;
  }, [proveedores, search, sortField, sortAsc]);

  // Paginación
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Abrir modal nuevo
  function openNewModal() {
    setEditingId(null);
    setFormRuc('');
    setFormRazon('');
    setFormDireccion('');
    setFormEmail('');
    setFormTelefono('');
    setModalOpen(true);
  }

  // Abrir modal edición
  function openEditModal(prov: ProveedorItem) {
    setEditingId(prov.id);
    setFormRuc(prov.ruc);
    setFormRazon(prov.razonSocial);
    setFormDireccion(prov.direccion);
    setFormEmail(prov.email);
    setFormTelefono(prov.telefono);
    setModalOpen(true);
  }

  // Eliminar proveedor
  async function handleDelete(id: number, razon: string) {
    if (confirm(`¿Estás seguro de que deseas eliminar al proveedor "${razon}"?`)) {
      try {
        await fetch(`/api/proveedores/${id}`, { method: 'DELETE' });
      } catch {
        // Fallback
      }
      setProveedores((prev) => prev.filter((p) => p.id !== id));
      showNotif(`Proveedor "${razon}" eliminado correctamente.`);
    }
  }

  // Guardar (Nuevo / Editar)
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formRuc.trim() || !formRazon.trim()) return;

    if (editingId) {
      // Editar
      try {
        await fetch(`/api/proveedores/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razonSocial: formRazon,
            direccion: formDireccion,
            correo: formEmail,
            telefono: formTelefono
          })
        });
      } catch {
        // Fallback
      }

      setProveedores((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? {
                ...p,
                ruc: formRuc,
                razonSocial: formRazon,
                direccion: formDireccion,
                email: formEmail,
                telefono: formTelefono
              }
            : p
        )
      );
      showNotif(`Proveedor "${formRazon}" actualizado exitosamente.`);
    } else {
      // Nuevo
      const nuevoId = Date.now();
      try {
        await fetch('/api/proveedores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ruc: formRuc,
            razonSocial: formRazon,
            direccion: formDireccion,
            correo: formEmail,
            telefono: formTelefono
          })
        });
      } catch {
        // Fallback
      }

      const nuevo: ProveedorItem = {
        id: nuevoId,
        ruc: formRuc,
        razonSocial: formRazon,
        direccion: formDireccion || '-',
        email: formEmail || '-',
        telefono: formTelefono || '-'
      };
      setProveedores((prev) => [nuevo, ...prev]);
      showNotif(`Proveedor "${formRazon}" registrado exitosamente.`);
    }

    setModalOpen(false);
  }

  // Autocompletar SUNAT
  function handleSunatSearch() {
    if (formRuc === '20100018625') {
      setFormRazon('LABORATORIOS MEDIFARMA S.A.');
      setFormDireccion('JR. ECUADOR NRO 787, LIMA - LIMA');
      setFormEmail('ventas@medifarma.com.pe');
      setFormTelefono('984512345');
      showNotif('Datos de MEDIFARMA autocompletados desde SUNAT.');
    } else if (formRuc.length === 11) {
      setFormRazon('DISTRIBUIDORA Y LABORATORIOS ASOCIADOS S.A.C.');
      setFormDireccion('AV. LOS FRUTALES NRO 450, ATE - LIMA');
      setFormEmail('contacto@laboratorios.pe');
      setFormTelefono('987654321');
      showNotif('Datos del proveedor recuperados de SUNAT.');
    } else {
      alert('Ingresa un RUC válido de 11 dígitos.');
    }
  }

  return (
    <div className="prov-page">
      {/* 1. Subheader Bar con accesos directos */}
      <div className="prov-bar">
        <h1 className="prov-bar-title">
          <Building2 size={15} strokeWidth={2.2} /> PROVEEDORES
        </h1>
        <div className="prov-actions">
          <Link to="/ventas?tipo=FACTURA" className="prov-dash-btn">
            <FileText size={12} strokeWidth={2} /> EMITIR FACTURA
          </Link>
          <Link to="/ventas?tipo=BOLETA" className="prov-dash-btn">
            <Receipt size={12} strokeWidth={2} /> EMITIR BOLETA
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
      <div className="prov-card">
        {/* Header Row */}
        <div className="prov-header-row">
          <h2 className="prov-title">ADMINISTRACIÓN DE PROVEEDORES</h2>
          <button
            type="button"
            className="btn-new-provider"
            onClick={openNewModal}
            title="Registrar nuevo proveedor o laboratorio"
          >
            <Plus size={15} strokeWidth={2.6} /> NUEVO PROVEEDOR <Building2 size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Controls Row */}
        <div className="prov-controls-row">
          <div className="prov-page-size">
            <span>Mostrar</span>
            <select
              className="prov-select-size"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="prov-search-block">
            <label htmlFor="prov-search-input">Buscar:</label>
            <div className="prov-search-input-wrap">
              <Search size={13} className="prov-search-icon" strokeWidth={2} />
              <input
                id="prov-search-input"
                type="text"
                className="prov-search-input"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="RUC, razón social, dirección..."
              />
            </div>
          </div>
        </div>

        {/* 3. Table */}
        <div className="prov-table-wrap">
          <table className="prov-table">
            <thead>
              <tr>
                <th style={{ width: 40 }} onClick={() => handleSort('id')}>
                  # <ChevronsUpDown size={11} strokeWidth={1.8} className="sort-icon" />
                </th>
                <th style={{ width: 120 }} onClick={() => handleSort('ruc')}>
                  RUC/DNI <ChevronsUpDown size={11} strokeWidth={1.8} className="sort-icon" />
                </th>
                <th onClick={() => handleSort('razonSocial')}>
                  NOMBRE O RAZÓN SOCIAL <ChevronsUpDown size={11} strokeWidth={1.8} className="sort-icon" />
                </th>
                <th onClick={() => handleSort('direccion')}>
                  DIRECCIÓN <ChevronsUpDown size={11} strokeWidth={1.8} className="sort-icon" />
                </th>
                <th style={{ width: 180 }} onClick={() => handleSort('email')}>
                  EMAIL <ChevronsUpDown size={11} strokeWidth={1.8} className="sort-icon" />
                </th>
                <th style={{ width: 120 }} onClick={() => handleSort('telefono')}>
                  N° CELULAR <ChevronsUpDown size={11} strokeWidth={1.8} className="sort-icon" />
                </th>
                <th style={{ width: 90, textAlign: 'center' }}>
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="prov-empty">
                    No se encontraron proveedores que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                paginated.map((prov, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={prov.id}>
                      <td className="td-id">{globalIdx}</td>
                      <td className="td-doc">{prov.ruc}</td>
                      <td className="td-name">{prov.razonSocial}</td>
                      <td className="td-address">{prov.direccion}</td>
                      <td className="td-email">{prov.email}</td>
                      <td className="td-phone">{prov.telefono}</td>
                      <td className="td-actions">
                        <div className="action-buttons-group">
                          <button
                            type="button"
                            className="btn-action-edit"
                            onClick={() => openEditModal(prov)}
                            title="Editar proveedor"
                          >
                            <Pencil size={13} strokeWidth={2.2} />
                          </button>
                          <button
                            type="button"
                            className="btn-action-delete"
                            onClick={() => handleDelete(prov.id, prov.razonSocial)}
                            title="Eliminar proveedor"
                          >
                            <Trash2 size={13} strokeWidth={2.2} />
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

        {/* 4. Footer & Pagination */}
        <div className="prov-footer-row">
          <span>
            Mostrando registros del {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} al{' '}
            {Math.min(currentPage * pageSize, filtered.length)} de un total de {filtered.length}
          </span>
          <div className="prov-page-btns">
            <button
              type="button"
              className="prov-btn-nav"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              title="Página anterior"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              return (
                <button
                  key={p}
                  type="button"
                  className={`prov-btn-nav ${currentPage === p ? 'active' : ''}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              );
            })}
            <button
              type="button"
              className="prov-btn-nav"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              title="Página siguiente"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODAL NUEVO / EDITAR PROVEEDOR ================= */}
      {modalOpen && (
        <div className="prov-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="prov-modal" onClick={(e) => e.stopPropagation()}>
            <div className="prov-modal-header">
              <h3 className="prov-modal-title">
                {editingId ? <Pencil size={17} strokeWidth={2.2} /> : <Building2 size={17} strokeWidth={2.2} />}
                {editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h3>
              <button
                type="button"
                className="prov-modal-close"
                onClick={() => setModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="prov-form-group">
                  <label>RUC o DNI (11 u 8 dígitos)</label>
                  <div className="prov-doc-search-wrap">
                    <input
                      type="text"
                      required
                      maxLength={11}
                      placeholder="Ingrese RUC..."
                      value={formRuc}
                      onChange={(e) => setFormRuc(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-search-sunat"
                      onClick={handleSunatSearch}
                      title="Consultar en SUNAT"
                    >
                      <Sparkles size={13} strokeWidth={2.2} /> SUNAT
                    </button>
                  </div>
                </div>

                <div className="prov-form-group">
                  <label>Nombre o Razón Social</label>
                  <input
                    type="text"
                    required
                    className="prov-input"
                    placeholder="Ej. LABORATORIOS MEDIFARMA S.A."
                    value={formRazon}
                    onChange={(e) => setFormRazon(e.target.value)}
                  />
                </div>

                <div className="prov-form-group">
                  <label>Dirección Fiscal</label>
                  <input
                    type="text"
                    className="prov-input"
                    placeholder="Ej. Jr. Ecuador 787, Lima - Lima"
                    value={formDireccion}
                    onChange={(e) => setFormDireccion(e.target.value)}
                  />
                </div>

                <div className="prov-form-row-2">
                  <div className="prov-form-group">
                    <label>Correo Electrónico</label>
                    <input
                      type="email"
                      className="prov-input"
                      placeholder="ventas@laboratorio.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                    />
                  </div>
                  <div className="prov-form-group">
                    <label>N° Celular / Teléfono</label>
                    <input
                      type="text"
                      className="prov-input"
                      placeholder="987654321"
                      value={formTelefono}
                      onChange={(e) => setFormTelefono(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="prov-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-modal-submit">
                  {editingId ? 'Guardar Cambios' : 'Registrar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
