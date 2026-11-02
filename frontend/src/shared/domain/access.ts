import type { Role } from './user';
const all: readonly Role[] = ['ADMINISTRADOR', 'VENDEDOR', 'ALMACENERO'];
export const routeAccess = {
  '/': all, '/productos': all, '/inventario': all,
  '/ventas': ['ADMINISTRADOR', 'VENDEDOR'],
  '/compras': ['ADMINISTRADOR', 'ALMACENERO'],
  '/proveedores': ['ADMINISTRADOR'],
  '/comprobantes': ['ADMINISTRADOR', 'VENDEDOR'],
  '/reportes': ['ADMINISTRADOR'], '/usuarios': ['ADMINISTRADOR'],
} satisfies Record<string, readonly Role[]>;
export type AppPath = keyof typeof routeAccess;
export function isAppPath(path: string): path is AppPath {
  return Object.prototype.hasOwnProperty.call(routeAccess, path);
}
export function canAccess(path: string, role: Role): boolean {
  return isAppPath(path) && (routeAccess[path] as readonly Role[]).includes(role);
}
export function safeDestination(path: string | null, role: Role): AppPath {
  return path && isAppPath(path) && canAccess(path, role) ? path : '/';
}
