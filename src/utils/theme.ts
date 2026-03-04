const API_URL = import.meta.env.VITE_API_URL || '';

export type ThemeOverrides = Record<string, string>;

export function applyTheme(overrides: ThemeOverrides): void {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(overrides)) {
    root.style.setProperty(key, value);
  }
}

export function clearTheme(keys: string[]): void {
  const root = document.documentElement;
  for (const key of keys) {
    root.style.removeProperty(key);
  }
}

export async function fetchAndApplyTheme(): Promise<void> {
  if (!import.meta.env.VITE_USE_API) return;

  try {
    const res = await fetch(`${API_URL}/api/settings/theme`);
    if (!res.ok) return;
    const overrides = await res.json();
    if (overrides && typeof overrides === 'object') {
      applyTheme(overrides as ThemeOverrides);
    }
  } catch {
    // API unavailable — use CSS defaults
  }
}
