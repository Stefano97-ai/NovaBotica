import { Button } from '../../shared/presentation/ui/button';
import { DraftProvider } from '../DraftProvider';
import { useState } from 'react';
import { NavLink, Outlet, useLoaderData } from 'react-router-dom';
import { Brand } from '../../shared/presentation/components/Brand';
import { ThemeToggle } from '../../shared/presentation/components/ThemeToggle';
import { navigationItems } from '../../shared/presentation/navigation';
import { canAccess } from '../../shared/domain/access';
import { roleNames, type User } from '../../shared/domain/user';
import { CurrentUserContext } from '../../features/auth/presentation/auth-context';
import { useLogout } from '../../features/auth/presentation/hooks/useLogout';
import { useSessionRevalidation } from '../../features/auth/presentation/hooks/useSessionRevalidation';
export function WorkspaceLayout() {
  const user = useLoaderData() as User;
  const [menu,setMenu] = useState(false);
  const { busy, error, logout } = useLogout();
  useSessionRevalidation();
  return <CurrentUserContext.Provider value={user}>
    <DraftProvider><div className="layout"><aside><Brand/>
      <Button className="menu-toggle" aria-expanded={menu} aria-controls="workspace-nav" onClick={()=>setMenu(!menu)}>{menu?'Cerrar menú':'Menú'}</Button>
      <nav id="workspace-nav" aria-label="Navegación principal" className={menu?'is-open':''}>
        {navigationItems.filter(item=>canAccess(item.path,user.rol)).map(item=><NavLink key={item.path} to={item.path} end={item.path==='/'} onClick={()=>setMenu(false)}>{item.label}</NavLink>)}
      </nav><ThemeToggle/>
      <div className="session-account"><strong>{user.nombre}</strong><span>{roleNames[user.rol]}</span>
        <Button onClick={logout} disabled={busy}>{busy?'Cerrando sesión…':'Cerrar sesión'}</Button>{error&&<p role="alert">{error}</p>}
      </div>
    </aside><main id="workspace-main"><Outlet/></main></div></DraftProvider>
  </CurrentUserContext.Provider>;
}
