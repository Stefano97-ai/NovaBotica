import { createContext, useContext } from 'react';
import type { DraftUseCases } from '../application/draft-use-cases';
export const DraftContext = createContext<DraftUseCases | null>(null);
export function useDraftService() {
  const service = useContext(DraftContext);
  if (!service) throw new Error('Falta el proveedor de borradores.');
  return service;
}
