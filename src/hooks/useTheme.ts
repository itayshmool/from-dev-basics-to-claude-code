import { useState, useCallback } from 'react';
import { reapplyThemeForMode } from '../utils/theme';

type Theme = 'light' | 'dark';

function getTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getTheme);

  const setTheme = useCallback((t: Theme) => {
    if (t === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', t);
    setThemeState(t);
    reapplyThemeForMode(t);
  }, []);

  const toggle = useCallback(() => {
    setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  }, [setTheme]);

  return { theme, toggle };
}
