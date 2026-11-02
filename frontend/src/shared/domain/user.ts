export type Role = 'ADMINISTRADOR' | 'VENDEDOR' | 'ALMACENERO';
export interface User { id: string; username: string; nombre: string; rol: Role }
export const roleNames: Record<Role, string> = {
  ADMINISTRADOR: 'Administrador', VENDEDOR: 'Vendedor', ALMACENERO: 'Almacenero',
};
