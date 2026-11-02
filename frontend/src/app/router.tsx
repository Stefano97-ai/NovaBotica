import { createBrowserRouter, redirect } from 'react-router-dom';
import { services } from './services';
import { WorkspaceLayout } from './layout/WorkspaceLayout';
import { RouteError } from './routing/RouteError';
import { routePages } from './routing/route-pages';
import { createSessionLoaders } from './routing/session-loaders';
import { navigationItems } from '../shared/presentation/navigation';
import LoginPage from '../features/auth/presentation/pages/login.page';
const loaders = createSessionLoaders(services.auth);
export const router = createBrowserRouter([
  {path:'/login',element:<LoginPage/>,errorElement:<RouteError/>,loader:loaders.login},
  {element:<WorkspaceLayout/>,loader:loaders.session,errorElement:<RouteError/>,children:
    navigationItems.map(item=>({path:item.path,element:routePages[item.path],loader:loaders.authorize(item.path)}))},
  {path:'*',loader:()=>redirect('/')},
]);
