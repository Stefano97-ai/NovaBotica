import { ThemeContext } from '../shared/presentation/theme-context';
import type { PropsWithChildren } from 'react';
import { AuthContext } from '../features/auth/presentation/auth-context';
import { InicioContext } from '../features/inicio/presentation/inicio-context';
import { services } from './services';
export function AppProviders({children}: PropsWithChildren) {
  return <ThemeContext.Provider value={services.theme}><AuthContext.Provider value={services.auth}><InicioContext.Provider value={services.inicio}>{children}</InicioContext.Provider></AuthContext.Provider></ThemeContext.Provider>;
}
