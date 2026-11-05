import type { ReactNode } from 'react';
import type { AppPath } from '../../shared/domain/access';
import AlertasPage from '../../features/alertas/presentation/pages/alertas.page';
import InicioPage from '../../features/inicio/presentation/pages/inicio.page';
import ProductosPage from '../../features/productos/presentation/pages/productos.page';
import InventarioPage from '../../features/inventario/presentation/pages/inventario.page';
import VentasPage from '../../features/ventas/presentation/pages/ventas.page';
import ComprasPage from '../../features/compras/presentation/pages/compras.page';
import ProveedoresPage from '../../features/proveedores/presentation/pages/proveedores.page';
import ComprobantesPage from '../../features/comprobantes/presentation/pages/comprobantes.page';
import ReportesPage from '../../features/reportes/pages/reportes.page';
import UsuariosPage from '../../features/usuarios/presentation/pages/usuarios.page';
export const routePages: Record<AppPath, ReactNode> = {
  '/alertas': <AlertasPage />,
  '/':<InicioPage/>, '/productos':<ProductosPage/>, '/inventario':<InventarioPage/>,
  '/ventas':<VentasPage/>, '/compras':<ComprasPage/>, '/proveedores':<ProveedoresPage/>,
  '/comprobantes':<ComprobantesPage/>, '/reportes':<ReportesPage/>, '/usuarios':<UsuariosPage/>,
};
