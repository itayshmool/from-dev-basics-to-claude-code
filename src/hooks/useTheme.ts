import { useState, useCallback } from 'react';
import { reapplyThemeForMode, setActivePalette, getActivePalette, getCachedPalettes, type Palette } from '../utils/theme';
import { apiFetch } from '../services/api';

type Theme = 'light' | 'dark';

function getTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getTheme);
  const [paletteSlug, setPaletteSlugState] = useState<string | null>(
    () => getActivePalette()?.slug || null,
  );

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

  const setPalette = useCallback(async (slug: string) => {
    const palettes = getCachedPalettes();
    const palette = palettes.find(p => p.slug === slug);
    if (!palette) return;

    setActivePalette(palette);
    setPaletteSlugState(slug);

    // Save to backend
    try {
      await apiFetch('/api/auth/palette', {
        method: 'PUT',
        body: JSON.stringify({ paletteId: palette.id }),
      });
    } catch { /* noop — localStorage already saved as fallback */ }
  }, []);

  const resetPalette = useCallback(async () => {
    const palettes = getCachedPalettes();
    const defaultPalette = palettes.find(p => p.isDefault) || null;
    setActivePalette(defaultPalette);
    setPaletteSlugState(defaultPalette?.slug || null);

    try {
      await apiFetch('/api/auth/palette', { method: 'DELETE' });
    } catch { /* noop */ }
  }, []);

  return { theme, toggle, paletteSlug, setPalette, resetPalette };
}

export type { Palette };
