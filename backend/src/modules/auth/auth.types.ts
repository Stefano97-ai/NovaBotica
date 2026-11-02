import type { Request } from 'express';
export type Role = 'ADMINISTRADOR' | 'VENDEDOR' | 'ALMACENERO';
export interface SessionUser { id: string; username: string; nombre: string; rol: Role }
export interface AuthRequest extends Request { user?: SessionUser }
