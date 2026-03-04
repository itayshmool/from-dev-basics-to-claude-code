const API_URL = import.meta.env.VITE_API_URL || '';

export type ThemeOverrides = Record<string, string>;

export interface DualThemeData {
  dark: ThemeOverrides;
  light: ThemeOverrides;
  [key: `--${string}`]: string;
}

// In-memory cache so we can re-apply on mode toggle
let cachedTheme: DualThemeData | null = null;

const MOBILE_STYLE_ID = 'admin-theme-mobile';

function getCurrentMode(): 'light' | 'dark' {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function extractSharedKeys(data: DualThemeData): ThemeOverrides {
  const shared: ThemeOverrides = {};
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('--') && typeof value === 'string') {
      shared[key] = value;
    }
  }
  return shared;
}

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
  // Also remove injected mobile style
  document.getElementById(MOBILE_STYLE_ID)?.remove();
}

/** Inject a <style> tag for mobile font-size overrides (media queries can't be inline). */
function applyMobileFontSizes(shared: ThemeOverrides): void {
  const bodyMobile = shared['--font-size-body-mobile'];
  const monoMobile = shared['--font-size-mono-mobile'];
  if (!bodyMobile && !monoMobile) return;

  let existing = document.getElementById(MOBILE_STYLE_ID) as HTMLStyleElement | null;
  if (!existing) {
    existing = document.createElement('style');
    existing.id = MOBILE_STYLE_ID;
    document.head.appendChild(existing);
  }

  const rules: string[] = [];
  if (bodyMobile) rules.push(`font-size: ${bodyMobile};`);
  existing.textContent = `@media (max-width: 767px) { :root { ${rules.join(' ')} } }`;
}

function applyForMode(mode: 'light' | 'dark', data: DualThemeData): void {
  // Clear any previously applied color overrides from both modes
  const allColorKeys = new Set([
    ...Object.keys(data.dark || {}),
    ...Object.keys(data.light || {}),
  ]);
  clearTheme([...allColorKeys]);

  // Apply the active mode's color overrides
  const modeOverrides = data[mode] || {};
  applyTheme(modeOverrides);

  // Apply shared keys (font sizes for desktop, etc.)
  const shared = extractSharedKeys(data);
  applyTheme(shared);

  // Inject mobile font-size media query
  applyMobileFontSizes(shared);
}

/** Re-apply cached admin theme for the given mode. Call after toggling data-theme. */
export function reapplyThemeForMode(mode: 'light' | 'dark'): void {
  if (!cachedTheme) return;
  applyForMode(mode, cachedTheme);
}

/** Normalize legacy flat shape or new dual shape into DualThemeData */
function normalize(raw: unknown): DualThemeData | null {
  if (!raw || typeof raw !== 'object') return null;

  const obj = raw as Record<string, unknown>;

  // New shape: has `dark` or `light` keys that are objects
  if (
    (obj.dark && typeof obj.dark === 'object') ||
    (obj.light && typeof obj.light === 'object')
  ) {
    return {
      dark: (obj.dark as ThemeOverrides) || {},
      light: (obj.light as ThemeOverrides) || {},
      ...extractSharedFromRaw(obj),
    } as DualThemeData;
  }

  // Legacy flat shape: treat all keys as dark-only overrides
  const flat: ThemeOverrides = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      flat[key] = value;
    }
  }
  return { dark: flat, light: {} } as DualThemeData;
}

function extractSharedFromRaw(obj: Record<string, unknown>): Record<string, string> {
  const shared: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('--') && typeof value === 'string') {
      shared[key] = value;
    }
  }
  return shared;
}

export async function fetchAndApplyTheme(): Promise<void> {
  if (!import.meta.env.VITE_USE_API) return;

  try {
    const res = await fetch(`${API_URL}/api/settings/theme`);
    if (!res.ok) return;
    const raw = await res.json();
    const data = normalize(raw);
    if (!data) return;

    cachedTheme = data;
    applyForMode(getCurrentMode(), data);
  } catch {
    // API unavailable — use CSS defaults
  }
}
