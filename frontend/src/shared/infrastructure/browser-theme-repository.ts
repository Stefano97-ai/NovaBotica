import type { ThemeRepository } from '../domain/theme';
export function createBrowserThemeRepository(root: HTMLElement, storage: Pick<Storage, 'setItem'>): ThemeRepository {
  return {
    read: () => root.dataset.theme === 'dark' ? 'dark' : 'light',
    save: theme => {
      root.dataset.theme = theme;
      try { storage.setItem('nova-theme', theme); } catch { /* The theme still works if browser storage is blocked. */ }
    },
  };
}
