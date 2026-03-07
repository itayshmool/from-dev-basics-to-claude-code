import { useState, useCallback } from 'react';

const STORAGE_KEY = 'seen-interactions';

function getSeenSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set();
}

function markSeen(type: string) {
  const set = getSeenSet();
  set.add(type);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch { /* ignore */ }
}

/**
 * Returns whether this is the first time the user encounters this interaction type.
 * After the component mounts, `isFirst` will be true once, then `dismiss()` should be called
 * (or it auto-dismisses). On subsequent encounters, `isFirst` is false.
 */
export function useFirstInteraction(type: string): { isFirst: boolean; dismiss: () => void } {
  const [isFirst] = useState(() => !getSeenSet().has(type));

  const dismiss = useCallback(() => {
    markSeen(type);
  }, [type]);

  // Auto-mark as seen when the hook mounts for the first time
  if (isFirst) {
    markSeen(type);
  }

  return { isFirst, dismiss };
}
