import { createBrowserRouter, NavLink, Outlet } from 'react-router-dom';
import Page0 from '../features/inicio/pages/inicio.page';
import Page1 from '../features/productos/pages/productos.page';
import Page2 from '../features/inventario/pages/inventario.page';
import Page3 from '../features/ventas/pages/ventas.page';
import Page4 from '../features/compras/pages/compras.page';
import Page5 from '../features/proveedores/pages/proveedores.page';
import Page6 from '../features/comprobantes/pages/comprobantes.page';
import Page7 from '../features/reportes/pages/reportes.page';
import Page8 from '../features/usuarios/pages/usuarios.page';

function Layout() { return <div className="layout"><aside><strong>Nova Salud</strong><nav><NavLink to="/" end>Inicio</NavLink><NavLink to="/productos">Productos</NavLink><NavLink to="/inventario">Inventario</NavLink><NavLink to="/ventas">Ventas</NavLink><NavLink to="/compras">Compras</NavLink><NavLink to="/proveedores">Proveedores</NavLink><NavLink to="/comprobantes">Comprobantes</NavLink><NavLink to="/reportes">Reportes</NavLink><NavLink to="/usuarios">Usuarios y roles</NavLink></nav></aside><main><Outlet /></main></div>; }
export const router = createBrowserRouter([{ element: <Layout />, children: [{ index: true, element: <Page0 /> },{ path: 'productos', element: <Page1 /> },{ path: 'inventario', element: <Page2 /> },{ path: 'ventas', element: <Page3 /> },{ path: 'compras', element: <Page4 /> },{ path: 'proveedores', element: <Page5 /> },{ path: 'comprobantes', element: <Page6 /> },{ path: 'reportes', element: <Page7 /> },{ path: 'usuarios', element: <Page8 /> }, { path: '*', element: <p>Página no encontrada.</p> }] }]);
