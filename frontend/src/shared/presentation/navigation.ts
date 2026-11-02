import type { AppPath } from '../domain/access';
export interface NavigationItem { path: AppPath; label: string; detail?: string }
export const navigationItems: readonly NavigationItem[] = [
  {path:'/',label:'Inicio'}, {path:'/productos',label:'Productos',detail:'Catálogo y precios'},
  {path:'/inventario',label:'Inventario',detail:'Existencias y lotes'}, {path:'/ventas',label:'Ventas',detail:'Atención y cobros'},
  {path:'/compras',label:'Compras',detail:'Abastecimiento'}, {path:'/proveedores',label:'Proveedores'},
  {path:'/comprobantes',label:'Comprobantes'}, {path:'/reportes',label:'Reportes'}, {path:'/usuarios',label:'Usuarios y roles'},
];
