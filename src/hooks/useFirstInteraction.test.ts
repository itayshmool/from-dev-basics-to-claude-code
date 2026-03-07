// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFirstInteraction } from './useFirstInteraction';

describe('useFirstInteraction', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns isFirst=true on first encounter', () => {
    const { result } = renderHook(() => useFirstInteraction('quiz'));
    expect(result.current.isFirst).toBe(true);
  });

  it('returns isFirst=false on second encounter', () => {
    renderHook(() => useFirstInteraction('quiz'));
    const { result } = renderHook(() => useFirstInteraction('quiz'));
    expect(result.current.isFirst).toBe(false);
  });

  it('tracks different types independently', () => {
    renderHook(() => useFirstInteraction('quiz'));
    const { result } = renderHook(() => useFirstInteraction('fillInBlank'));
    expect(result.current.isFirst).toBe(true);
  });

  it('persists to localStorage', () => {
    renderHook(() => useFirstInteraction('quiz'));
    const stored = JSON.parse(localStorage.getItem('seen-interactions') || '[]');
    expect(stored).toContain('quiz');
  });
});
