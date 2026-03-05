import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme';

// Mock the api module
vi.mock('../services/api', () => ({
  apiFetch: vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) }),
}));

// Mock theme utilities
vi.mock('../utils/theme', () => {
  let activePalette: { slug: string } | null = null;
  const palettes = [
    { slug: 'default-palette', id: 'aaa', isDefault: true },
    { slug: 'ocean', id: 'bbb', isDefault: false },
  ];

  return {
    reapplyThemeForMode: vi.fn(),
    setActivePalette: vi.fn((p: { slug: string } | null) => { activePalette = p; }),
    getActivePalette: vi.fn(() => activePalette),
    getCachedPalettes: vi.fn(() => palettes),
  };
});

describe('useTheme hook', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('toggle switches between dark and light mode', () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.theme).toBe('dark');

    act(() => result.current.toggle());
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    act(() => result.current.toggle());
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBeNull();
  });

  it('toggle persists preference to localStorage', () => {
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggle());
    expect(localStorage.getItem('theme')).toBe('light');

    act(() => result.current.toggle());
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('setPalette calls API and sets active palette', async () => {
    const { apiFetch } = await import('../services/api');
    const { setActivePalette } = await import('../utils/theme');
    const { result } = renderHook(() => useTheme());

    await act(async () => {
      await result.current.setPalette('ocean');
    });

    expect(setActivePalette).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'ocean' })
    );
    expect(apiFetch).toHaveBeenCalledWith('/api/auth/palette', {
      method: 'PUT',
      body: JSON.stringify({ paletteId: 'bbb' }),
    });
  });

  it('resetPalette calls DELETE API and reverts to default', async () => {
    const { apiFetch } = await import('../services/api');
    const { setActivePalette } = await import('../utils/theme');
    const { result } = renderHook(() => useTheme());

    await act(async () => {
      await result.current.resetPalette();
    });

    expect(setActivePalette).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'default-palette', isDefault: true })
    );
    expect(apiFetch).toHaveBeenCalledWith('/api/auth/palette', { method: 'DELETE' });
  });
});
