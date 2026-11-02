import type { Theme, ThemeRepository } from '../domain/theme';
export interface ThemeUseCases { current(): Theme; change(theme: Theme): void }
export function createThemeUseCases(repository: ThemeRepository): ThemeUseCases {
  return { current: () => repository.read(), change: theme => repository.save(theme) };
}
