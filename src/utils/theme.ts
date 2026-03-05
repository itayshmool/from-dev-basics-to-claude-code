const API_URL = import.meta.env.VITE_API_URL || '';

export type ThemeOverrides = Record<string, string>;

export interface DualThemeData {
  dark: ThemeOverrides;
  light: ThemeOverrides;
  [key: `--${string}`]: string;
}

export interface Palette {
  id: string;
  name: string;
  slug: string;
  colors: { dark: ThemeOverrides; light: ThemeOverrides };
  isDefault: boolean;
  order: number;
}

// In-memory caches
let cachedTheme: DualThemeData | null = null;
let cachedPalettes: Palette[] | null = null;
let cachedActivePalette: Palette | null = null;

const MOBILE_STYLE_ID = 'admin-theme-mobile';
const PALETTE_STORAGE_KEY = 'palette-slug';

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

  const vars: string[] = [];
  if (bodyMobile) vars.push(`--font-size-body-mobile: ${bodyMobile};`);
  if (monoMobile) vars.push(`--font-size-mono-mobile: ${monoMobile};`);
  existing.textContent = `@media (max-width: 767px) { :root { ${vars.join(' ')} } }`;
}

/** Clear all palette-applied CSS vars */
function clearPaletteOverrides(): void {
  if (!cachedActivePalette) return;
  const allKeys = new Set([
    ...Object.keys(cachedActivePalette.colors.dark || {}),
    ...Object.keys(cachedActivePalette.colors.light || {}),
  ]);
  const root = document.documentElement;
  for (const key of allKeys) {
    root.style.removeProperty(key);
  }
}

/** Apply palette colors for the given mode */
function applyPaletteForMode(mode: 'light' | 'dark', palette: Palette): void {
  const modeColors = palette.colors[mode] || {};
  applyTheme(modeColors);
}

function applyAdminForMode(mode: 'light' | 'dark', data: DualThemeData): void {
  const modeOverrides = data[mode] || {};
  applyTheme(modeOverrides);

  const shared = extractSharedKeys(data);
  applyTheme(shared);
  applyMobileFontSizes(shared);
}

/** Full apply: palette first, then admin overrides on top */
function applyAll(mode: 'light' | 'dark'): void {
  // 1. Clear any previous palette overrides
  clearPaletteOverrides();

  // 2. Apply palette
  if (cachedActivePalette) {
    applyPaletteForMode(mode, cachedActivePalette);
  }

  // 3. Admin overrides layer on top (admin always wins)
  if (cachedTheme) {
    applyAdminForMode(mode, cachedTheme);
  }
}

/** Re-apply cached theme + palette for the given mode. Call after toggling data-theme. */
export function reapplyThemeForMode(mode: 'light' | 'dark'): void {
  applyAll(mode);
}

/** Fetch palettes from API and cache them */
export async function fetchPalettes(): Promise<Palette[]> {
  if (cachedPalettes) return cachedPalettes;
  if (!import.meta.env.VITE_USE_API) return [];

  try {
    const res = await fetch(`${API_URL}/api/palettes`);
    if (!res.ok) return [];
    const data: Palette[] = await res.json();
    cachedPalettes = data;
    return data;
  } catch {
    return [];
  }
}

/** Get cached palettes (no fetch) */
export function getCachedPalettes(): Palette[] {
  return cachedPalettes || [];
}

/** Set the active palette and apply it */
export function setActivePalette(palette: Palette | null): void {
  clearPaletteOverrides(); // Clear old palette before switching
  cachedActivePalette = palette;
  applyAll(getCurrentMode());

  // Persist slug to localStorage as fallback
  try {
    if (palette) {
      localStorage.setItem(PALETTE_STORAGE_KEY, palette.slug);
    } else {
      localStorage.removeItem(PALETTE_STORAGE_KEY);
    }
  } catch { /* noop */ }
}

/** Get the stored palette slug from localStorage */
export function getStoredPaletteSlug(): string | null {
  try {
    return localStorage.getItem(PALETTE_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Select palette by ID (from user record) or slug (from localStorage) */
export function selectPalette(paletteId?: string | null): void {
  if (!cachedPalettes || cachedPalettes.length === 0) return;

  let palette: Palette | undefined;

  if (paletteId) {
    palette = cachedPalettes.find(p => p.id === paletteId);
  }

  if (!palette) {
    const storedSlug = getStoredPaletteSlug();
    if (storedSlug) {
      palette = cachedPalettes.find(p => p.slug === storedSlug);
    }
  }

  if (!palette) {
    palette = cachedPalettes.find(p => p.isDefault);
  }

  cachedActivePalette = palette || null;
}

/** Get the currently active palette */
export function getActivePalette(): Palette | null {
  return cachedActivePalette;
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

export async function fetchAndApplyTheme(paletteId?: string | null): Promise<void> {
  if (!import.meta.env.VITE_USE_API) return;

  try {
    // Fetch palettes and admin theme in parallel
    const [palettesResult, themeRes] = await Promise.all([
      fetchPalettes(),
      fetch(`${API_URL}/api/settings/theme`),
    ]);

    // Select and cache the active palette
    if (palettesResult.length > 0) {
      selectPalette(paletteId);
    }

    // Cache admin theme
    if (themeRes.ok) {
      const raw = await themeRes.json();
      const data = normalize(raw);
      cachedTheme = data;
    }

    // Apply everything
    applyAll(getCurrentMode());
  } catch {
    // API unavailable — use CSS defaults
  }
}
