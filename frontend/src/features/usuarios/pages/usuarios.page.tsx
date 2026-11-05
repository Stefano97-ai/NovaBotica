import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  UserPlus,
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
  KeyRound,
  Power,
  Users,
  Shield,
  ShoppingCart,
  Boxes,
  Check,
  Eye,
  EyeOff
} from 'lucide-react';
import './usuarios.css';

interface UsuarioItem {
  id: number;
  username: string;
  nombre: string;
  rolCodigo: 'ADMINISTRADOR' | 'VENDEDOR' | 'ALMACENERO';
  rolNombre: string;
  activo: boolean;
  creadoEn: string;
}

const INITIAL_USUARIOS: UsuarioItem[] = [
  {
    id: 1,
    username: 'admin',
    nombre: 'Administrador General',
    rolCodigo: 'ADMINISTRADOR',
    rolNombre: 'Administrador del sistema',
    activo: true,
    creadoEn: '2026-01-10T08:00:00Z'
  },
  {
    id: 2,
    username: 'vendedor1',
    nombre: 'Carlos Mendoza Ríos',
    rolCodigo: 'VENDEDOR',
    rolNombre: 'Vendedor de mostrador',
    activo: true,
    creadoEn: '2026-01-15T09:30:00Z'
  },
  {
    id: 3,
    username: 'almacen1',
    nombre: 'Jorge Huamán Torres',
    rolCodigo: 'ALMACENERO',
    rolNombre: 'Almacenero de botica',
    activo: true,
    creadoEn: '2026-02-01T10:15:00Z'
  }
];

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>(INITIAL_USUARIOS);
  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMINISTRADOR' | 'VENDEDOR' | 'ALMACENERO'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof UsuarioItem>('id');
  const [sortAsc, setSortAsc] = useState(true);

  // Notification state
  const [notif, setNotif] = useState<string | null>(null);

  // Modal Usuario (Nuevo / Editar)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formUsername, setFormUsername] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRol, setFormRol] = useState<'ADMINISTRADOR' | 'VENDEDOR' | 'ALMACENERO'>('VENDEDOR');
  const [formActivo, setFormActivo] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Modal Reset Password
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Cargar usuarios del backend al montar
  useEffect(() => {
    fetch('/api/usuarios')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          const mapped: UsuarioItem[] = data.map((u: any, idx: number) => ({
            id: u.id || idx + 1,
            username: u.username || 'user',
            nombre: u.nombre || 'Usuario',
            rolCodigo: (u.rolCodigo || 'VENDEDOR') as any,
            rolNombre: u.rolNombre || 'Vendedor',
            activo: u.activo ?? true,
            creadoEn: u.creadoEn || new Date().toISOString()
          }));
          setUsuarios(mapped);
        }
      })
      .catch(() => {
        // Usar datos iniciales si no hay conexión
      });
  }, []);

  function showNotif(msg: string) {
    setNotif(msg);
    setTimeout(() => setNotif(null), 3500);
  }

  // KPIs
  const stats = useMemo(() => {
    const total = usuarios.length;
    const admins = usuarios.filter((u) => u.rolCodigo === 'ADMINISTRADOR').length;
    const vendedores = usuarios.filter((u) => u.rolCodigo === 'VENDEDOR').length;
    const almaceneros = usuarios.filter((u) => u.rolCodigo === 'ALMACENERO').length;
    const activos = usuarios.filter((u) => u.activo).length;
    return { total, admins, vendedores, almaceneros, activos };
  }, [usuarios]);

  // Filtrado y ordenamiento
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = usuarios.filter((u) => {
      const matchSearch =
        !q ||
        u.username.toLowerCase().includes(q) ||
        u.nombre.toLowerCase().includes(q) ||
        u.rolNombre.toLowerCase().includes(q);
      const matchRole = roleFilter === 'ALL' || u.rolCodigo === roleFilter;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && u.activo) ||
        (statusFilter === 'INACTIVE' && !u.activo);
      return matchSearch && matchRole && matchStatus;
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
  }, [usuarios, search, roleFilter, statusFilter, sortField, sortAsc]);

  // Paginación
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  function handleSort(field: keyof UsuarioItem) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  // Abrir modal nuevo
  function openNewModal() {
    setEditingId(null);
    setFormUsername('');
    setFormNombre('');
    setFormPassword('');
    setFormRol('VENDEDOR');
    setFormActivo(true);
    setShowPassword(false);
    setModalOpen(true);
  }

  // Abrir modal edición
  function openEditModal(user: UsuarioItem) {
    setEditingId(user.id);
    setFormUsername(user.username);
    setFormNombre(user.nombre);
    setFormPassword('');
    setFormRol(user.rolCodigo);
    setFormActivo(user.activo);
    setShowPassword(false);
    setModalOpen(true);
  }

  // Abrir modal cambio de contraseña
  function openPasswordModal(user: UsuarioItem) {
    setPasswordUserId(user.id);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordModalOpen(true);
  }

  // Toggle Activo/Inactivo
  async function handleToggleStatus(user: UsuarioItem) {
    const nuevoEstado = !user.activo;
    try {
      await fetch(`/api/usuarios/${user.id}/activo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: nuevoEstado })
      });
    } catch {
      // Fallback
    }

    setUsuarios((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, activo: nuevoEstado } : u))
    );
    showNotif(`Usuario "${user.username}" ahora está ${nuevoEstado ? 'ACTIVO' : 'INACTIVO'}.`);
  }

  // Eliminar usuario
  async function handleDelete(id: number, username: string) {
    if (username === 'admin') {
      alert('No es posible eliminar la cuenta principal de Administrador.');
      return;
    }
    if (confirm(`¿Estás seguro de que deseas eliminar la cuenta "${username}"?`)) {
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      showNotif(`Cuenta de usuario "${username}" eliminada.`);
    }
  }

  // Guardar (Nuevo / Editar)
  async function handleSaveUser(e: React.FormEvent) {
    e.preventDefault();
    if (!formUsername.trim() || !formNombre.trim()) return;

    const rolLabelMap = {
      ADMINISTRADOR: 'Administrador del sistema',
      VENDEDOR: 'Vendedor de mostrador',
      ALMACENERO: 'Almacenero de botica'
    };

    if (editingId) {
      // Editar
      try {
        await fetch(`/api/usuarios/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: formNombre.trim(),
            password: formPassword.trim() || undefined,
            rolCodigo: formRol,
            activo: formActivo
          })
        });
      } catch {
        // Fallback
      }

      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === editingId
            ? {
                ...u,
                nombre: formNombre.trim(),
                rolCodigo: formRol,
                rolNombre: rolLabelMap[formRol],
                activo: formActivo
              }
            : u
        )
      );
      showNotif(`Usuario "${formUsername}" actualizado exitosamente.`);
    } else {
      // Nuevo
      if (!formPassword.trim()) {
        alert('Debes ingresar una contraseña temporal para la nueva cuenta.');
        return;
      }

      const nuevoId = Date.now();
      try {
        await fetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formUsername.trim().toLowerCase(),
            nombre: formNombre.trim(),
            password: formPassword.trim(),
            rolCodigo: formRol
          })
        });
      } catch {
        // Fallback
      }

      const nuevo: UsuarioItem = {
        id: nuevoId,
        username: formUsername.trim().toLowerCase(),
        nombre: formNombre.trim(),
        rolCodigo: formRol,
        rolNombre: rolLabelMap[formRol],
        activo: formActivo,
        creadoEn: new Date().toISOString()
      };
      setUsuarios((prev) => [nuevo, ...prev]);
      showNotif(`Usuario "${formUsername}" creado correctamente con rol ${formRol}.`);
    }

    setModalOpen(false);
  }

  // Guardar nueva contraseña
  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden. Por favor verifica.');
      return;
    }

    if (passwordUserId) {
      const targetUser = usuarios.find((u) => u.id === passwordUserId);
      if (targetUser) {
        try {
          await fetch(`/api/usuarios/${passwordUserId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nombre: targetUser.nombre,
              password: newPassword,
              rolCodigo: targetUser.rolCodigo,
              activo: targetUser.activo
            })
          });
        } catch {
          // Fallback
        }
        showNotif(`Contraseña actualizada con éxito para "${targetUser.username}".`);
      }
    }

    setPasswordModalOpen(false);
  }

  return (
    <div className="usr-page">
      {/* 1. Subheader Bar con accesos directos */}
      <div className="usr-bar">
        <h1 className="usr-bar-title">
          <ShieldCheck size={15} strokeWidth={2.2} /> USUARIOS Y ROLES
        </h1>
        <div className="usr-actions">
          <Link to="/ventas?tipo=FACTURA" className="usr-dash-btn">
            <FileText size={12} strokeWidth={2} /> EMITIR FACTURA
          </Link>
          <Link to="/ventas?tipo=BOLETA" className="usr-dash-btn">
            <Receipt size={12} strokeWidth={2} /> EMITIR BOLETA
          </Link>
        </div>
      </div>

      {/* Notificación Flash */}
      {notif && (
        <div
          style={{
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
          }}
        >
          <CheckCircle2 size={16} />
          <span>{notif}</span>
        </div>
      )}

      {/* 2. KPI Ribbon Cards */}
      <div className="usr-stats-grid">
        <div className="usr-stat-card">
          <div className="usr-stat-icon total">
            <Users size={20} strokeWidth={2.4} />
          </div>
          <div className="usr-stat-info">
            <span className="usr-stat-val">{stats.total}</span>
            <span className="usr-stat-lbl">Total Usuarios</span>
          </div>
        </div>

        <div className="usr-stat-card">
          <div className="usr-stat-icon admin">
            <ShieldCheck size={20} strokeWidth={2.4} />
          </div>
          <div className="usr-stat-info">
            <span className="usr-stat-val">{stats.admins}</span>
            <span className="usr-stat-lbl">Administradores</span>
          </div>
        </div>

        <div className="usr-stat-card">
          <div className="usr-stat-icon vendedor">
            <ShoppingCart size={20} strokeWidth={2.4} />
          </div>
          <div className="usr-stat-info">
            <span className="usr-stat-val">{stats.vendedores}</span>
            <span className="usr-stat-lbl">Vendedores</span>
          </div>
        </div>

        <div className="usr-stat-card">
          <div className="usr-stat-icon almacen">
            <Boxes size={20} strokeWidth={2.4} />
          </div>
          <div className="usr-stat-info">
            <span className="usr-stat-val">{stats.almaceneros}</span>
            <span className="usr-stat-lbl">Almaceneros</span>
          </div>
        </div>

        <div className="usr-stat-card">
          <div className="usr-stat-icon active">
            <CheckCircle2 size={20} strokeWidth={2.4} />
          </div>
          <div className="usr-stat-info">
            <span className="usr-stat-val">{stats.activos}</span>
            <span className="usr-stat-lbl">Cuentas Activas</span>
          </div>
        </div>
      </div>

      {/* 3. Main Card Panel */}
      <div className="usr-card">
        {/* Header Row */}
        <div className="usr-header-row">
          <div className="usr-title-wrap">
            <h2 className="usr-title">ADMINISTRACIÓN DE USUARIOS Y ROLES</h2>
            <div className="usr-tabs">
              <button
                type="button"
                className={`usr-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <Users size={14} /> Cuentas de Usuario
              </button>
              <button
                type="button"
                className={`usr-tab-btn ${activeTab === 'matrix' ? 'active' : ''}`}
                onClick={() => setActiveTab('matrix')}
              >
                <ShieldCheck size={14} /> Matriz de Permisos
              </button>
            </div>
          </div>

          {activeTab === 'users' && (
            <button
              type="button"
              className="btn-new-user"
              onClick={openNewModal}
              title="Registrar nuevo usuario en el sistema"
            >
              <span style={{ fontSize: 14, fontWeight: 900 }}>+</span> NUEVO USUARIO <UserPlus size={14} />
            </button>
          )}
        </div>

        {activeTab === 'users' ? (
          <>
            {/* Controls Row */}
            <div className="usr-controls-row">
              <div className="usr-filters-group">
                <div className="usr-control-item">
                  <span>Mostrar</span>
                  <select
                    className="usr-select"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="usr-control-item">
                  <span>Rol:</span>
                  <select
                    className="usr-select"
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value as any);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="ALL">Todos los roles</option>
                    <option value="ADMINISTRADOR">Administrador</option>
                    <option value="VENDEDOR">Vendedor</option>
                    <option value="ALMACENERO">Almacenero</option>
                  </select>
                </div>

                <div className="usr-control-item">
                  <span>Estado:</span>
                  <select
                    className="usr-select"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as any);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="ALL">Todos los estados</option>
                    <option value="ACTIVE">Activos</option>
                    <option value="INACTIVE">Inactivos</option>
                  </select>
                </div>
              </div>

              <div className="usr-search-wrap">
                <Search size={13} className="usr-search-icon" strokeWidth={2} />
                <input
                  type="text"
                  className="usr-search-input"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Buscar usuario o nombre..."
                />
              </div>
            </div>

            {/* Table */}
            <div className="usr-table-wrap">
              <table className="usr-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }} onClick={() => handleSort('id')}>
                      # <ChevronsUpDown size={11} strokeWidth={1.8} />
                    </th>
                    <th style={{ width: 140 }} onClick={() => handleSort('username')}>
                      USUARIO <ChevronsUpDown size={11} strokeWidth={1.8} />
                    </th>
                    <th onClick={() => handleSort('nombre')}>
                      NOMBRE COMPLETO <ChevronsUpDown size={11} strokeWidth={1.8} />
                    </th>
                    <th style={{ width: 140 }} onClick={() => handleSort('rolCodigo')}>
                      ROL ASIGNADO <ChevronsUpDown size={11} strokeWidth={1.8} />
                    </th>
                    <th>PERMISOS PRINCIPALES</th>
                    <th style={{ width: 100, textAlign: 'center' }} onClick={() => handleSort('activo')}>
                      ESTADO <ChevronsUpDown size={11} strokeWidth={1.8} />
                    </th>
                    <th style={{ width: 110 }} onClick={() => handleSort('creadoEn')}>
                      CREADO <ChevronsUpDown size={11} strokeWidth={1.8} />
                    </th>
                    <th style={{ width: 110, textAlign: 'center' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: 36, color: '#64748b' }}>
                        No se encontraron cuentas de usuario con los criterios aplicados.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((user, idx) => {
                      const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                      const initial = user.nombre.charAt(0) || user.username.charAt(0);
                      const roleClass =
                        user.rolCodigo === 'ADMINISTRADOR'
                          ? 'admin'
                          : user.rolCodigo === 'VENDEDOR'
                          ? 'vendedor'
                          : 'almacen';

                      return (
                        <tr key={user.id}>
                          <td style={{ color: '#475569', fontWeight: 700 }}>{globalIdx}</td>
                          <td>
                            <div className="usr-login-cell">
                              <div className={`usr-avatar-badge ${roleClass}`}>{initial}</div>
                              <span className="usr-username">{user.username}</span>
                            </div>
                          </td>
                          <td style={{ color: '#0f172a', fontWeight: 700 }}>{user.nombre}</td>
                          <td>
                            <span className={`usr-role-pill ${roleClass}`}>
                              {user.rolCodigo === 'ADMINISTRADOR' && <Shield size={11} />}
                              {user.rolCodigo === 'VENDEDOR' && <ShoppingCart size={11} />}
                              {user.rolCodigo === 'ALMACENERO' && <Boxes size={11} />}
                              {user.rolCodigo}
                            </span>
                          </td>
                          <td>
                            <div className="usr-perms-tags">
                              {user.rolCodigo === 'ADMINISTRADOR' && (
                                <>
                                  <span className="usr-perm-tag">Acceso Total</span>
                                  <span className="usr-perm-tag">Ventas / POS</span>
                                  <span className="usr-perm-tag">Inventario FEFO</span>
                                  <span className="usr-perm-tag">Compras & Proveedores</span>
                                  <span className="usr-perm-tag">Seguridad</span>
                                </>
                              )}
                              {user.rolCodigo === 'VENDEDOR' && (
                                <>
                                  <span className="usr-perm-tag">Punto de Venta (POS)</span>
                                  <span className="usr-perm-tag">Facturas / Boletas</span>
                                  <span className="usr-perm-tag">Consulta Stock</span>
                                </>
                              )}
                              {user.rolCodigo === 'ALMACENERO' && (
                                <>
                                  <span className="usr-perm-tag">Inventario FEFO</span>
                                  <span className="usr-perm-tag">Lotes & Vencimientos</span>
                                  <span className="usr-perm-tag">Registro de Compras</span>
                                  <span className="usr-perm-tag">Ajustes Stock</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className={`usr-status-pill ${user.activo ? 'active' : 'inactive'}`}
                              onClick={() => handleToggleStatus(user)}
                              title="Clic para cambiar estado activo/inactivo"
                            >
                              <span className={`usr-status-dot ${user.activo ? 'active' : 'inactive'}`} />
                              {user.activo ? 'Activo' : 'Inactivo'}
                            </button>
                          </td>
                          <td style={{ color: '#64748b', fontSize: 11 }}>
                            {new Date(user.creadoEn).toLocaleDateString('es-PE', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="usr-action-btns">
                              <button
                                type="button"
                                className="btn-usr-action edit"
                                onClick={() => openEditModal(user)}
                                title="Editar datos y rol del usuario"
                              >
                                <Pencil size={13} strokeWidth={2.2} />
                              </button>
                              <button
                                type="button"
                                className="btn-usr-action key"
                                onClick={() => openPasswordModal(user)}
                                title="Cambiar contraseña"
                              >
                                <KeyRound size={13} strokeWidth={2.2} />
                              </button>
                              <button
                                type="button"
                                className="btn-usr-action toggle"
                                onClick={() => handleToggleStatus(user)}
                                title={user.activo ? 'Desactivar usuario' : 'Activar usuario'}
                              >
                                <Power size={13} strokeWidth={2.2} />
                              </button>
                              {user.username !== 'admin' && (
                                <button
                                  type="button"
                                  className="btn-usr-action delete"
                                  onClick={() => handleDelete(user.id, user.username)}
                                  title="Eliminar usuario"
                                >
                                  <Trash2 size={13} strokeWidth={2.2} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Row */}
            <div className="usr-footer-row">
              <span>
                Mostrando registros del {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} al{' '}
                {Math.min(currentPage * pageSize, filtered.length)} de un total de {filtered.length}
              </span>
              <div className="usr-page-btns">
                <button
                  type="button"
                  className="usr-btn-nav"
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
                      className={`usr-btn-nav ${currentPage === p ? 'active' : ''}`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className="usr-btn-nav"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="Página siguiente"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Matriz de Roles y Permisos */
          <div className="usr-matrix-wrap">
            <table className="usr-matrix-table">
              <thead>
                <tr>
                  <th className="mod-col">MÓDULO / FUNCIONALIDAD DE LA BOTICA</th>
                  <th className="role-col">
                    <div style={{ color: '#6b21a8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Shield size={14} /> ADMINISTRADOR
                    </div>
                  </th>
                  <th className="role-col">
                    <div style={{ color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <ShoppingCart size={14} /> VENDEDOR
                    </div>
                  </th>
                  <th className="role-col">
                    <div style={{ color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Boxes size={14} /> ALMACENERO
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="mod-desc">
                    Punto de Venta (POS) y Carrito de Compras
                    <small>Búsqueda rápida de medicamentos, cálculo de total y cobro de venta.</small>
                  </td>
                  <td className="check-cell"><span className="perm-badge-yes"><Check size={11} /> Total</span></td>
                  <td className="check-cell"><span className="perm-badge-yes"><Check size={11} /> Total</span></td>
                  <td className="check-cell"><span className="perm-badge-no"><X size={11} /> Denegado</span></td>
                </tr>
                <tr>
                  <td className="mod-desc">
                    Emisión de Comprobantes SUNAT
                    <small>Generación de Factura Electrónica, Boleta Electrónica y Nota de Venta interna.</small>
                  </td>
                  <td className="check-cell"><span className="perm-badge-yes"><Check size={11} /> Total</span></td>
                  <td className="check-cell"><span className="perm-badge-yes"><Check size={11} /> Total</span></td>
                  <td className="check-cell"><span className="perm-badge-no"><X size={11} /> Denegado</span></td>
                </tr>
                <tr>
                  <td className="mod-desc">
                    Catálogo de Productos y Precios
                    <small>Creación de nuevos medicamentos, edición de costos, márgenes e IGV.</small>
                  </td>
                  <td className="check-cell"><span className="perm-badge-yes"><Check size={11} /> Edición Total</span></td>
                  <td className="check-cell"><span className="perm-badge-yes"><Check size={11} /> Solo Consulta</span></td>
                  <td className="check-cell"><span className="perm-badge-yes"><Check size={11} /> Solo Consulta</span></td>
                </tr>
                <tr>
                  <td className="mod-desc">
                    Trazabilidad de Lotes y Vencimientos FEFO (DIGEMID)
                    <small>Control de lotes, alertas de expiración próxima y cuarentena sanitaria.</small>
                  </td>
                  <td className="check-cell"><span className="perm-badge-yes"><Check size={11} /> Total</span></td>
                  <td className="check-cell"><span className="perm-badge-yes"><Check size={11} /> Solo Lectura</span></td>
                  <td className="check-cell"><span className="perm-badge-yes"><Check size={11} /> Total</span></td>
                </tr>
                <tr>
                  <td className="mod-desc">
                    Registro de Compras a Droguerías y Laboratorios
                    <small>Ingreso de facturas de compra, actualización automática de stock y costos.</small>
                  </td>
                  <td className="check-cell"><span className="perm-badge-yes"><Check size={11} /> Total</span></td>
                  <td className="check-cell"><span className="perm-badge-no"><X size={11} /> Denegado</span></td>
                  <td className="check-cell"><span className="perm-badge-yes"><Check size={11} /> Total</span></td>
                </tr>
                <tr>
                  <td className="mod-desc">
                    Directorio y Mantenimiento de Proveedores
                    <small>Alta y edición de laboratorios con consulta RUC en línea a SUNAT.</small>
                  </td>
                  <td className="check-cell"><span className="perm-badge-yes"><Check size={11} /> Total</span></td>
                  <td className="check-cell"><span className="perm-badge-no"><X size={11} /> Denegado</span></td>
                  <td className="check-cell"><span className="perm-badge-no"><X size={11} /> Denegado</span></td>
                </tr>
                <tr>
                  <td className="mod-desc">
                    Ajustes de Inventario y Transferencias entre Sedes
                    <small>Regularización de mermas, roturas y transferencias a sedes secundarias.</small>
                  </td>
                  <td className="check-cell"><span className="perm-badge-yes"><Check size={11} /> Total</span></td>
                  <td className="check-cell"><span className="perm-badge-no"><X size={11} /> Denegado</span></td>
                  <td className="check-cell"><span className="perm-badge-yes"><Check size={11} /> Total</span></td>
                </tr>
                <tr>
                  <td className="mod-desc">
                    Reportes Financieros, Cierre de Caja y Kardex SUNAT
                    <small>Liquidación diaria de caja chica, utilidades brutas y libros electrónicos.</small>
                  </td>
                  <td className="check-cell"><span className="perm-badge-yes"><Check size={11} /> Total</span></td>
                  <td className="check-cell"><span className="perm-badge-no"><X size={11} /> Denegado</span></td>
                  <td className="check-cell"><span className="perm-badge-no"><X size={11} /> Denegado</span></td>
                </tr>
                <tr>
                  <td className="mod-desc">
                    Administración de Usuarios y Seguridad
                    <small>Gestión de credenciales, roles, activación y reseteo de contraseñas.</small>
                  </td>
                  <td className="check-cell"><span className="perm-badge-yes"><Check size={11} /> Total</span></td>
                  <td className="check-cell"><span className="perm-badge-no"><X size={11} /> Denegado</span></td>
                  <td className="check-cell"><span className="perm-badge-no"><X size={11} /> Denegado</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL NUEVO / EDITAR USUARIO ================= */}
      {modalOpen && (
        <div className="usr-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="usr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="usr-modal-header">
              <h3 className="usr-modal-title">
                {editingId ? <Pencil size={17} strokeWidth={2.2} /> : <UserPlus size={17} strokeWidth={2.2} />}
                {editingId ? 'Editar Cuenta de Usuario' : 'Nuevo Usuario del Sistema'}
              </h3>
              <button
                type="button"
                className="usr-modal-close"
                onClick={() => setModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="usr-form-group">
                  <label>Nombre de Usuario (Login)</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingId}
                    className="usr-input"
                    placeholder="Ej. c_mendoza, vendedor2"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value.toLowerCase().trim())}
                  />
                  {editingId && (
                    <small style={{ color: '#64748b', fontSize: 11 }}>
                      El nombre de usuario no puede modificarse una vez creado.
                    </small>
                  )}
                </div>

                <div className="usr-form-group">
                  <label>Nombre Completo del Colaborador</label>
                  <input
                    type="text"
                    required
                    className="usr-input"
                    placeholder="Ej. Carlos Mendoza Ríos"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                  />
                </div>

                <div className="usr-form-group">
                  <label>Rol Asignado en la Botica</label>
                  <select
                    className="usr-select"
                    style={{ height: 38 }}
                    value={formRol}
                    onChange={(e) => setFormRol(e.target.value as any)}
                  >
                    <option value="VENDEDOR">Vendedor (Punto de Venta POS, Emisión)</option>
                    <option value="ALMACENERO">Almacenero (Inventario FEFO, Lotes, Compras)</option>
                    <option value="ADMINISTRADOR">Administrador (Acceso Total y Configuración)</option>
                  </select>
                </div>

                {/* Vista previa de permisos del rol seleccionado */}
                <div className="usr-role-card-preview">
                  <strong style={{ color: '#1e293b' }}>Resumen de permisos: </strong>
                  {formRol === 'ADMINISTRADOR' && (
                    <span>Control total de ventas, compras, inventario, reportes y configuración de cuentas.</span>
                  )}
                  {formRol === 'VENDEDOR' && (
                    <span>Habilitado para cobro en POS, emisión de facturas/boletas y consulta de stock disponible.</span>
                  )}
                  {formRol === 'ALMACENERO' && (
                    <span>Habilitado para recepción de compras, control de lotes FEFO, ajustes y transferencias.</span>
                  )}
                </div>

                {(!editingId || formPassword) && (
                  <div className="usr-form-group">
                    <label>{editingId ? 'Nueva Contraseña (Opcional)' : 'Contraseña Inicial'}</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required={!editingId}
                        minLength={6}
                        className="usr-input"
                        style={{ width: '100%', paddingRight: 40 }}
                        placeholder={editingId ? 'Dejar en blanco para mantener la actual' : 'Mínimo 6 caracteres...'}
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        style={{
                          position: 'absolute',
                          right: 10,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#64748b'
                        }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="usr-form-group">
                  <label>Estado de la Cuenta</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#1e293b' }}>
                    <input
                      type="checkbox"
                      checked={formActivo}
                      onChange={(e) => setFormActivo(e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <span>Cuenta de usuario activa y con acceso al sistema</span>
                  </label>
                </div>
              </div>

              <div className="usr-modal-actions">
                <button
                  type="button"
                  className="btn-usr-cancel"
                  onClick={() => setModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-usr-submit">
                  {editingId ? 'Actualizar Usuario' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL CAMBIAR CONTRASEÑA ================= */}
      {passwordModalOpen && (
        <div className="usr-modal-backdrop" onClick={() => setPasswordModalOpen(false)}>
          <div className="usr-modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="usr-modal-header">
              <h3 className="usr-modal-title">
                <KeyRound size={17} strokeWidth={2.2} /> Cambiar Contraseña
              </h3>
              <button
                type="button"
                className="usr-modal-close"
                onClick={() => setPasswordModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePassword}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                  Ingresa una nueva contraseña segura para el usuario seleccionado (mínimo 6 caracteres).
                </p>

                <div className="usr-form-group">
                  <label>Nueva Contraseña</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="usr-input"
                    placeholder="Al menos 6 caracteres..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="usr-form-group">
                  <label>Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="usr-input"
                    placeholder="Repita la nueva contraseña..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="usr-modal-actions">
                <button
                  type="button"
                  className="btn-usr-cancel"
                  onClick={() => setPasswordModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-usr-submit">
                  Actualizar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
