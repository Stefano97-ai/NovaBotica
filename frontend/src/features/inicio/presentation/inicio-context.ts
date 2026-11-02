import { createContext, useContext } from 'react';
import type { InicioUseCases } from '../application/inicio-use-cases';
export const InicioContext = createContext<InicioUseCases | null>(null);
export function useInicio(): InicioUseCases {
  const value = useContext(InicioContext);
  if (!value) throw new Error('Falta InicioContext en la composición de la aplicación.');
  return value;
}
