import { createContext, useContext, useState } from 'react';
import type { ThemeUseCases } from '../application/theme-use-cases';
export const ThemeContext = createContext<ThemeUseCases | null>(null);
export function useTheme() {
  const preferences = useContext(ThemeContext);
  if (!preferences) throw new Error('Falta ThemeContext en la composición de la aplicación.');
  const [theme, setTheme] = useState(() => preferences.current());
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    preferences.change(next);
    setTheme(next);
  }
  return { dark: theme === 'dark', toggle };
}
