import { ThemeToggle } from '../shared/components/ThemeToggle';
import { useEffect, useState } from 'react';
import { createBrowserRouter, NavLink, Outlet, redirect, useLoaderData, useNavigate, useRevalidator, useRouteError } from 'react-router-dom';
import type { LoaderFunctionArgs } from 'react-router-dom';
import { AuthError, authRequest } from '../features/auth/api/auth';
import type { Role, User } from '../features/auth/api/auth';
import { Brand } from '../features/auth/components/Brand';
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

const entries: {path:string;label:string;roles:Role[];element:React.ReactNode}[] = [
{path:'/',label:'Inicio',roles:['ADMINISTRADOR','VENDEDOR','ALMACENERO'],element:<Page0/>},
{path:'/productos',label:'Productos',roles:['ADMINISTRADOR','VENDEDOR','ALMACENERO'],element:<Page1/>},
{path:'/inventario',label:'Inventario',roles:['ADMINISTRADOR','VENDEDOR','ALMACENERO'],element:<Page2/>},
{path:'/ventas',label:'Ventas',roles:['ADMINISTRADOR','VENDEDOR'],element:<Page3/>},
{path:'/compras',label:'Compras',roles:['ADMINISTRADOR','ALMACENERO'],element:<Page4/>},
{path:'/proveedores',label:'Proveedores',roles:['ADMINISTRADOR'],element:<Page5/>},
{path:'/comprobantes',label:'Comprobantes',roles:['ADMINISTRADOR','VENDEDOR'],element:<Page6/>},
{path:'/reportes',label:'Reportes',roles:['ADMINISTRADOR'],element:<Page7/>},
{path:'/usuarios',label:'Usuarios y roles',roles:['ADMINISTRADOR'],element:<Page8/>},
];
async function sessionLoader({request}:LoaderFunctionArgs) {
  try {return (await authRequest<{user:User}>('me')).user;}
  catch(error) {
    if(error instanceof AuthError && error.status===401) return redirect('/login?next='+encodeURIComponent(new URL(request.url).pathname));
    throw error;
  }
}
function RouteError() {
  const error=useRouteError();
  return <div className="session-state"><Brand/><h1>No pudimos abrir tu sesión</h1><p>{error instanceof Error?error.message:'Vuelve a intentarlo en un momento.'}</p><button onClick={()=>window.location.reload()}>Volver a intentar</button><a href="/login">Ir al inicio de sesión</a></div>;
}
function Layout() {
  const user=useLoaderData() as User;
  const navigate=useNavigate();
  const revalidator=useRevalidator();
  const [menu,setMenu]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>{
    const check=()=>{if(document.visibilityState==='visible') revalidator.revalidate();};
    window.addEventListener('focus',check);
    const timer=window.setInterval(check,60000);
    return ()=>{window.removeEventListener('focus',check);window.clearInterval(timer);};
  },[revalidator]);
  async function logout() {
    if(busy)return;
    setBusy(true);setError('');
    try {await authRequest('logout',{});navigate('/login',{replace:true});}
    catch(failure){setError(failure instanceof Error?failure.message:'No se pudo cerrar la sesión.');}
    finally{setBusy(false);}
  }
  const roleNames:Record<Role,string>={ADMINISTRADOR:'Administrador',VENDEDOR:'Vendedor',ALMACENERO:'Almacenero'};
  return <div className="layout"><aside><Brand/><button className="menu-toggle" aria-expanded={menu} aria-controls="workspace-nav" onClick={()=>setMenu(!menu)}>{menu?'Cerrar menú':'Menú'}</button><nav id="workspace-nav" aria-label="Navegación principal" className={menu?'is-open':''}>{entries.filter(entry=>entry.roles.includes(user.rol)).map(entry=><NavLink key={entry.path} to={entry.path} end={entry.path==='/'} onClick={()=>setMenu(false)}>{entry.label}</NavLink>)}</nav><ThemeToggle/><div className="session-account"><strong>{user.nombre}</strong><span>{roleNames[user.rol]}</span><button onClick={logout} disabled={busy}>{busy?'Cerrando sesión…':'Cerrar sesión'}</button>{error&&<p role="alert">{error}</p>}</div></aside><main id="workspace-main"><Outlet/></main></div>;
}
export const router=createBrowserRouter([
{path:'/login',element:<LoginPage/>,errorElement:<RouteError/>,loader:async()=>{
  try{await authRequest('me');return redirect('/');}
  catch(error){if(error instanceof AuthError && error.status===401)return null;return null;}
}},
{element:<Layout/>,loader:sessionLoader,errorElement:<RouteError/>,children:entries.map(entry=>({
  path:entry.path,
  element:entry.element,
  loader:async(args:LoaderFunctionArgs)=>{
    const result=await sessionLoader(args);
    if(result instanceof Response)return result;
    return entry.roles.includes(result.rol)?null:redirect('/');
  }
}))},
{path:'*',loader:()=>redirect('/')}
]);
