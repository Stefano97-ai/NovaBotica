export type Theme = 'light' | 'dark';
export interface ThemeRepository { read(): Theme; save(theme: Theme): void }
