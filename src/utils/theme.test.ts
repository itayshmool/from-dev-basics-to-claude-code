// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Palette } from './theme';

// Mock import.meta.env before importing the module
vi.stubEnv('VITE_USE_API', 'true');
vi.stubEnv('VITE_API_URL', '');

const mockPalettes: Palette[] = [
  {
    id: 'aaa-111',
    name: 'Test Default',
    slug: 'test-default',
    colors: {
      dark: {
        '--color-bg-primary': '#111111',
        '--color-text-primary': '#EEEEEE',
        '--color-purple': '#FF0000',
      },
      light: {
        '--color-bg-primary': '#FAFAFA',
        '--color-text-primary': '#111111',
        '--color-purple': '#CC0000',
      },
    },
    isDefault: true,
    order: 0,
  },
  {
    id: 'bbb-222',
    name: 'Test Ocean',
    slug: 'test-ocean',
    colors: {
      dark: {
        '--color-bg-primary': '#0A1628',
        '--color-text-primary': '#E2E8F0',
        '--color-purple': '#06B6D4',
      },
      light: {
        '--color-bg-primary': '#F0F9FF',
        '--color-text-primary': '#0C1A2E',
        '--color-purple': '#0891B2',
      },
    },
    isDefault: false,
    order: 1,
  },
];

// We need to dynamically import theme.ts to get fresh module state per test
// But since module caches are tricky, we'll use vi.resetModules() + dynamic import
let theme: typeof import('./theme');

async function loadTheme() {
  vi.resetModules();
  theme = await import('./theme');
}

// Populate the internal cachedPalettes by mocking fetch and calling fetchPalettes
async function seedPalettes(palettes: Palette[] = mockPalettes) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(palettes),
  }));
  await theme.fetchPalettes();
}

describe('theme utility — applyTheme / clearTheme', () => {
  beforeEach(async () => {
    await loadTheme();
    // Clean up root inline styles
    document.documentElement.style.cssText = '';
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  it('applyTheme sets CSS custom properties on the root element', () => {
    theme.applyTheme({
      '--color-bg-primary': '#123456',
      '--color-purple': '#ABCDEF',
    });

    expect(document.documentElement.style.getPropertyValue('--color-bg-primary')).toBe('#123456');
    expect(document.documentElement.style.getPropertyValue('--color-purple')).toBe('#ABCDEF');
  });

  it('clearTheme removes specified CSS properties from root', () => {
    document.documentElement.style.setProperty('--color-bg-primary', '#111');
    document.documentElement.style.setProperty('--color-purple', '#222');

    theme.clearTheme(['--color-bg-primary']);

    expect(document.documentElement.style.getPropertyValue('--color-bg-primary')).toBe('');
    expect(document.documentElement.style.getPropertyValue('--color-purple')).toBe('#222');
  });
});

describe('theme utility — setActivePalette', () => {
  beforeEach(async () => {
    await loadTheme();
    document.documentElement.style.cssText = '';
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  it('applies palette dark colors as CSS vars and saves slug to localStorage', async () => {
    await seedPalettes();

    theme.setActivePalette(mockPalettes[1]);

    expect(document.documentElement.style.getPropertyValue('--color-bg-primary')).toBe('#0A1628');
    expect(document.documentElement.style.getPropertyValue('--color-purple')).toBe('#06B6D4');
    expect(localStorage.getItem('palette-slug')).toBe('test-ocean');
  });

  it('applies light mode colors when data-theme is light', async () => {
    document.documentElement.setAttribute('data-theme', 'light');
    await seedPalettes();

    theme.setActivePalette(mockPalettes[1]);

    expect(document.documentElement.style.getPropertyValue('--color-bg-primary')).toBe('#F0F9FF');
    expect(document.documentElement.style.getPropertyValue('--color-purple')).toBe('#0891B2');
  });

  it('setActivePalette(null) clears overrides and removes localStorage key', async () => {
    await seedPalettes();
    theme.setActivePalette(mockPalettes[1]);

    // Verify palette was applied
    expect(document.documentElement.style.getPropertyValue('--color-bg-primary')).toBe('#0A1628');

    theme.setActivePalette(null);

    expect(document.documentElement.style.getPropertyValue('--color-bg-primary')).toBe('');
    expect(localStorage.getItem('palette-slug')).toBeNull();
  });
});

describe('theme utility — selectPalette', () => {
  beforeEach(async () => {
    await loadTheme();
    document.documentElement.style.cssText = '';
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  it('selects palette by ID', async () => {
    await seedPalettes();

    theme.selectPalette('bbb-222');

    expect(theme.getActivePalette()?.slug).toBe('test-ocean');
  });

  it('falls back to localStorage slug when no ID provided', async () => {
    localStorage.setItem('palette-slug', 'test-ocean');
    await seedPalettes();

    theme.selectPalette(null);

    expect(theme.getActivePalette()?.slug).toBe('test-ocean');
  });

  it('falls back to default palette when no ID and no localStorage', async () => {
    await seedPalettes();

    theme.selectPalette(null);

    expect(theme.getActivePalette()?.slug).toBe('test-default');
    expect(theme.getActivePalette()?.isDefault).toBe(true);
  });

  it('ignores unknown paletteId and falls back to default', async () => {
    await seedPalettes();

    theme.selectPalette('unknown-id');

    expect(theme.getActivePalette()?.slug).toBe('test-default');
  });
});

describe('theme utility — reapplyThemeForMode', () => {
  beforeEach(async () => {
    await loadTheme();
    document.documentElement.style.cssText = '';
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  it('re-applies palette colors for the given mode', async () => {
    await seedPalettes();
    theme.setActivePalette(mockPalettes[1]);

    // Currently dark mode — verify dark colors
    expect(document.documentElement.style.getPropertyValue('--color-bg-primary')).toBe('#0A1628');

    // Switch to light mode
    document.documentElement.setAttribute('data-theme', 'light');
    theme.reapplyThemeForMode('light');

    expect(document.documentElement.style.getPropertyValue('--color-bg-primary')).toBe('#F0F9FF');
  });
});

describe('theme utility — priority chain (palette + admin overrides)', () => {
  beforeEach(async () => {
    await loadTheme();
    document.documentElement.style.cssText = '';
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
  });

  it('admin overrides win over palette colors on conflicting keys', async () => {
    // Set up: mock fetch to return palettes first, then admin theme
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockPalettes) })  // palettes
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({                  // admin theme
        dark: { '--color-purple': '#ADMIN_DARK' },
        light: { '--color-purple': '#ADMIN_LIGHT' },
      })});

    vi.stubGlobal('fetch', fetchMock);

    await theme.fetchAndApplyTheme('bbb-222');

    // Palette set bg-primary to #0A1628, admin didn't touch it — palette wins
    expect(document.documentElement.style.getPropertyValue('--color-bg-primary')).toBe('#0A1628');
    // Admin override should win for --color-purple
    expect(document.documentElement.style.getPropertyValue('--color-purple')).toBe('#ADMIN_DARK');
  });
});
