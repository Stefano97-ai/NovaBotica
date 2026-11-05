import { useEffect, useState, useCallback } from 'react';
import { createBrowserRouter, NavLink, Outlet, redirect, useLoaderData, useLocation, useNavigate, useRevalidator, useRouteError } from 'react-router-dom';
import type { LoaderFunctionArgs } from 'react-router-dom';
import {
  LogOut,
  Bell,
  Menu,
  X,
  Sun,
  Moon,
  UserRound,
  User as UserIcon,
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Truck,
  Building2,
  BarChart3,
  ShieldCheck,
  ChevronDown,
  List
} from 'lucide-react';
import { AuthError, authRequest } from '../features/auth/api/auth';
import type { Role, User } from '../features/auth/api/auth';
import LoginPage from '../features/auth/pages/login.page';
import Page0 from '../features/inicio/pages/inicio.page';
import Page1 from '../features/productos/pages/productos.page';
import Page2 from '../features/inventario/pages/inventario.page';
import Page3 from '../features/ventas/pages/ventas.page';
import Page4 from '../features/compras/pages/compras.page';
import Page5 from '../features/proveedores/pages/proveedores.page';
import Page6 from '../features/comprobantes/pages/comprobantes.page';
import Page7 from '../features/reportes/pages/reportes.page';
import Page8 from '../features/usuarios/pages/usuarios.page';
import AlertasPage from '../features/alertas/presentation/pages/alertas.page';
import { AlertBell } from '../features/alertas/presentation/components/alert-bell';
import { AlertsProvider } from '../features/alertas/presentation/alerts-context';
import { alertsRepository } from '../features/alertas/infrastructure/http-alerts-repository';

interface NavSubItem {
  path: string;
  label: string;
  icon?: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
  element: React.ReactNode;
}

interface NavEntry {
  path?: string;
  label: string;
  roles: Role[];
  icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
  element?: React.ReactNode;
  children?: NavSubItem[];
}

const entries: NavEntry[] = [
  { path: '/', label: 'Inicio', roles: ['ADMINISTRADOR', 'VENDEDOR', 'ALMACENERO'], icon: LayoutDashboard, element: <Page0 /> },
  { path: '/alertas', label: 'Alertas', roles: ['ADMINISTRADOR', 'VENDEDOR', 'ALMACENERO'], icon: Bell, element: <AlertasPage /> },
  { path: '/ventas', label: 'Ventas', roles: ['ADMINISTRADOR', 'VENDEDOR'], icon: ShoppingCart, element: <Page3 /> },
  { path: '/comprobantes', label: 'Comprobantes', roles: ['ADMINISTRADOR', 'VENDEDOR'], icon: Receipt, element: <Page6 /> },
  {
    label: 'Inventario',
    roles: ['ADMINISTRADOR', 'VENDEDOR', 'ALMACENERO'],
    icon: ShoppingCart, // Matching screenshot 1 cart icon
    children: [
      {
        path: '/productos',
        label: 'Administrar Productos',
        icon: List,
        element: <Page2 view="productos" />
      },
      {
        path: '/inventario/kardex',
        label: 'Kardex',
        icon: List,
        element: <Page2 view="kardex" />
      }
    ]
  },
  { path: '/compras', label: 'Compras', roles: ['ADMINISTRADOR', 'ALMACENERO'], icon: Truck, element: <Page4 /> },
  { path: '/proveedores', label: 'Proveedores', roles: ['ADMINISTRADOR'], icon: Building2, element: <Page5 /> },
  { path: '/reportes', label: 'Reportes', roles: ['ADMINISTRADOR'], icon: BarChart3, element: <Page7 /> },
  { path: '/usuarios', label: 'Usuarios y roles', roles: ['ADMINISTRADOR'], icon: ShieldCheck, element: <Page8 /> },
];

async function sessionLoader({ request }: LoaderFunctionArgs) {
  try {
    return (await authRequest<{ user: User }>('me')).user;
  } catch (error) {
    if (error instanceof AuthError && error.status === 401) {
      return redirect('/login?next=' + encodeURIComponent(new URL(request.url).pathname));
    }
    throw error;
  }
}

function RouteError() {
  const error = useRouteError();
  return (
    <div className="route-error-shell">
      <div className="route-error-card">
        <h1>No pudimos abrir tu sesión</h1>
        <p>{error instanceof Error ? error.message : 'Vuelve a intentarlo en un momento.'}</p>
        <div className="route-error-actions">
          <button
            type="button"
            className="route-error-btn"
            onClick={() => window.location.reload()}
          >
            Volver a intentar
          </button>
          <a href="/login" className="route-error-link">
            Ir al inicio de sesión
          </a>
        </div>
      </div>
    </div>
  );
}

function Layout() {
  const user = useLoaderData() as User;
  const navigate = useNavigate();
  const location = useLocation();
  const alertsUnauthorized = useCallback(() => navigate('/login', { replace: true }), [navigate]);
  const revalidator = useRevalidator();
  const [busy, setBusy] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>(() => ({
    Inventario: true,
  }));
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 960px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 960px)');
    const update = () => {
      setNarrow(media.matches);
      if (!media.matches) setMobileOpen(false);
    };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    if (!narrow || !mobileOpen) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        document.querySelector<HTMLButtonElement>('.topbar-burger')?.focus();
      }
    };
    window.addEventListener('keydown', close);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', close);
    };
  }, [narrow, mobileOpen]);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('nova-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // Ignore
    }
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function changeTheme(mode: 'dark' | 'light') {
    document.documentElement.dataset.theme = mode;
    try {
      localStorage.setItem('nova-theme', mode);
    } catch {
      // Ignore
    }
    setTheme(mode);
  }

  useEffect(() => {
    const check = () => {
      if (document.visibilityState === 'visible') revalidator.revalidate();
    };
    window.addEventListener('focus', check);
    const timer = window.setInterval(check, 60000);
    return () => {
      window.removeEventListener('focus', check);
      window.clearInterval(timer);
    };
  }, [revalidator]);

  async function logout() {
    if (busy) return;
    setBusy(true);
    try {
      await authRequest('logout', {});
      navigate('/login', { replace: true });
    } catch {
      // Ignore
    } finally {
      setBusy(false);
    }
  }

  const roleNames: Record<Role, string> = {
    ADMINISTRADOR: 'Administrador',
    VENDEDOR: 'Vendedor',
    ALMACENERO: 'Almacenero',
  };
  const roleTitles: Record<Role, string> = {
    ADMINISTRADOR: 'Administrador del sistema',
    VENDEDOR: 'Vendedor de mostrador',
    ALMACENERO: 'Almacenero de botica',
  };

  const allowedEntries = entries.filter((entry) => entry.roles.includes(user.rol));

  return (
    <AlertsProvider key={user.id + ':' + user.rol} source={alertsRepository} refreshKey={location.key} onUnauthorized={alertsUnauthorized}>
    <div className={`layout ${!narrow && collapsed ? 'sidebar-mini' : ''} ${narrow && mobileOpen ? 'mobile-nav-open' : ''}`}>
      {/* TOPBAR */}
      <header className="erp-topbar">
        <div className="topbar-brand">{!narrow && collapsed ? 'NS' : 'NOVA SALUD'}</div>

        <div className="topbar-left">
          <button
            type="button"
            className="topbar-burger"
            aria-label={narrow ? (mobileOpen ? 'Cerrar menú' : 'Abrir menú') : 'Mostrar u ocultar menú'}
            aria-controls="workspace-sidebar"
            aria-expanded={narrow ? mobileOpen : !collapsed}
            title="Mostrar / ocultar menú"
            onClick={() => {
              if (narrow) setMobileOpen((v) => !v);
              else setCollapsed((v) => !v);
            }}
          >
            {narrow && mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button
            type="button"
            className={`theme-orb orb-sun ${theme === 'light' ? 'is-active' : ''}`}
            title="Cambiar a modo claro"
            aria-label="Cambiar a modo claro"
            onClick={() => changeTheme('light')}
          >
            <Sun size={15} />
          </button>
          <button
            type="button"
            className={`theme-orb orb-moon ${theme === 'dark' ? 'is-active' : ''}`}
            title="Cambiar a modo oscuro"
            aria-label="Cambiar a modo oscuro"
            onClick={() => changeTheme('dark')}
          >
            <Moon size={14} />
          </button>
        </div>

        <div className="topbar-right">
          <AlertBell />
          <div className="topbar-user" title={`Usuario: ${user.nombre}`}>
            <span className="topbar-avatar-small"><UserRound size={14} /></span>
            <span className="topbar-user-name">{roleNames[user.rol] || 'Administrador'}</span>
          </div>
          <button className="icon-btn logout-icon" aria-label="Cerrar sesión" title="Cerrar sesión" onClick={logout} disabled={busy}>
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {/* SIDEBAR + MAIN */}
      <div className="erp-container">
        {narrow && mobileOpen && (
          <div
            className="sidebar-backdrop"
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <aside id="workspace-sidebar" className={`erp-sidebar ${!narrow && collapsed ? 'is-collapsed' : ''} ${narrow && mobileOpen ? 'is-mobile-open' : ''}`}>
          <div className="sidebar-profile">
            <div className="avatar-large">
              <UserRound className="avatar-icon" />
            </div>
            <span className="profile-title">{roleTitles[user.rol]}</span>
          </div>
          <div className="profile-role-bar">
            <UserIcon size={12} />
            <span>{roleNames[user.rol]}</span>
          </div>

          <nav className="sidebar-nav" aria-label="Menú principal">
            {allowedEntries.map((entry) => {
              const Icon = entry.icon;

              if (entry.children && entry.children.length > 0) {
                const isOpen = openSubmenus[entry.label] ?? true;
                const isGroupActive = entry.children.some((child) => location.pathname === child.path);

                return (
                  <div key={entry.label} className={`nav-group ${isGroupActive ? 'has-active-child' : ''}`}>
                    <button
                      type="button"
                      className={`nav-group-header ${isGroupActive ? 'has-active-child' : ''}`}
                      title={entry.label}
                      onClick={() => {
                        if (!narrow && collapsed) {
                          setCollapsed(false);
                          setOpenSubmenus((prev) => ({ ...prev, [entry.label]: true }));
                        } else {
                          setOpenSubmenus((prev) => ({ ...prev, [entry.label]: !isOpen }));
                        }
                      }}
                      aria-expanded={(!narrow && collapsed) ? false : isOpen}
                    >
                      <div className="nav-group-left">
                        <Icon size={16} strokeWidth={2} />
                        <span>{entry.label}</span>
                      </div>
                      <ChevronDown size={14} className={`nav-group-arrow ${isOpen ? 'is-rotated' : ''}`} />
                    </button>
                    {isOpen && !(!narrow && collapsed) && (
                      <div className="nav-submenu">
                        {entry.children.map((sub) => {
                          const SubIcon = sub.icon || List;
                          return (
                            <NavLink
                              key={sub.path}
                              to={sub.path}
                              className={({ isActive }) => `nav-sublink ${isActive ? 'active' : ''}`}
                              onClick={() => { if (narrow) setMobileOpen(false); }}
                            >
                              <SubIcon size={14} strokeWidth={2} />
                              <span>{sub.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={entry.path}
                  to={entry.path!}
                  end={entry.path === '/'}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => { if (narrow) setMobileOpen(false); }}
                  aria-label={entry.label}
                  title={entry.label}
                >
                  <Icon size={16} strokeWidth={2} />
                  <span>{entry.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main id="workspace-main">
          <Outlet context={user} />
        </main>
      </div>
    </div>
    </AlertsProvider>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <RouteError />,
    loader: async () => {
      try {
        await authRequest('me');
        return redirect('/');
      } catch (error) {
        if (error instanceof AuthError && error.status === 401) return null;
        return null;
      }
    },
  },
  {
    path: '/ventas',
    element: <Page3 />,
    loader: async (args: LoaderFunctionArgs) => {
      const result = await sessionLoader(args);
      if (result instanceof Response) return result;
      return ['ADMINISTRADOR', 'VENDEDOR'].includes(result.rol) ? null : redirect('/');
    },
    errorElement: <RouteError />,
  },
  {
    element: <Layout />,
    loader: sessionLoader,
    errorElement: <RouteError />,
    children: [
      {
        path: '/inventario',
        loader: () => redirect('/inventario/kardex'),
      },
      ...entries
        .filter((entry) => entry.path !== '/ventas')
        .flatMap((entry) => {
        if (entry.children && entry.children.length > 0) {
          return entry.children.map((child) => ({
            path: child.path,
            element: child.element,
            loader: async (args: LoaderFunctionArgs) => {
              const result = await sessionLoader(args);
              if (result instanceof Response) return result;
              return entry.roles.includes(result.rol) ? null : redirect('/');
            },
          }));
        }
        return [
          {
            path: entry.path!,
            element: entry.element!,
            loader: async (args: LoaderFunctionArgs) => {
              const result = await sessionLoader(args);
              if (result instanceof Response) return result;
              return entry.roles.includes(result.rol) ? null : redirect('/');
            },
          },
        ];
      }),
    ],
  },
  { path: '*', loader: () => redirect('/') },
]);
