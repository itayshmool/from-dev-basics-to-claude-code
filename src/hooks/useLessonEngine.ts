import { useState, useMemo, useSyncExternalStore, useCallback } from 'react';
import { LessonEngine } from '../core/lesson/LessonEngine';
import type { Lesson } from '../core/lesson/types';

export function useLessonEngine(lesson: Lesson | null, startIndex = 0) {
  const engine = useMemo(() => {
    if (!lesson) return null;
    return new LessonEngine(lesson, startIndex);
  }, [lesson, startIndex]);

  // Force re-render when engine state changes
  const [, setTick] = useState(0);
  useSyncExternalStore(
    useCallback((cb: () => void) => {
      if (!engine) return () => {};
      return engine.subscribe(() => {
        setTick((t) => t + 1);
        cb();
      });
    }, [engine]),
    () => engine?.getCurrentSectionIndex() ?? 0
  );

  return engine;
}
