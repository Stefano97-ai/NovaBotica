import { createContext, useContext } from 'react';
import type { AuthUseCases } from '../application/auth-use-cases';
import type { User } from '../../../shared/domain/user';
export const AuthContext = createContext<AuthUseCases | null>(null);
export const CurrentUserContext = createContext<User | null>(null);
export function useAuth(): AuthUseCases {
  const value = useContext(AuthContext);
  if (!value) throw new Error('Falta AuthContext en la composición de la aplicación.');
  return value;
}
export function useCurrentUser(): User {
  const value = useContext(CurrentUserContext);
  if (!value) throw new Error('Esta pantalla requiere una sesión autenticada.');
  return value;
}
