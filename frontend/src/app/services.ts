import { createThemeUseCases } from '../shared/application/theme-use-cases';
import { createBrowserThemeRepository } from '../shared/infrastructure/browser-theme-repository';
import { createHttpClient } from '../shared/infrastructure/http-client';
import { createHttpAuthRepository } from '../features/auth/infrastructure/http-auth-repository';
import { createHttpSummaryRepository } from '../features/inicio/infrastructure/http-summary-repository';
import { createAuthUseCases } from '../features/auth/application/auth-use-cases';
import { createInicioUseCases } from '../features/inicio/application/inicio-use-cases';
const http = createHttpClient(window.fetch.bind(window));
export const services = {
  theme: createThemeUseCases(createBrowserThemeRepository(document.documentElement, { setItem: (key, value) => window.localStorage.setItem(key, value) })),
  auth: createAuthUseCases(createHttpAuthRepository(http)),
  inicio: createInicioUseCases(createHttpSummaryRepository(http)),
};
