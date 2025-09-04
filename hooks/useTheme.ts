import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Theme } from '../types';

export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'charcoal');

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-theme', theme);
  }, [theme]);

  return [theme, setTheme];
}
