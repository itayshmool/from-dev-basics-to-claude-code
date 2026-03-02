import { useSyncExternalStore, useCallback } from 'react';
import { progressTracker } from '../core/progress/ProgressTracker';
import type { ProgressState } from '../core/progress/types';

export function useProgress() {
  const state = useSyncExternalStore(
    (cb) => progressTracker.subscribe(cb),
    () => progressTracker.getState()
  );

  const markLessonComplete = useCallback((lessonId: string, level: number) => {
    progressTracker.markLessonComplete(lessonId, level);
  }, []);

  const setCurrentLesson = useCallback((lessonId: string, sectionIndex = 0) => {
    progressTracker.setCurrentLesson(lessonId, sectionIndex);
  }, []);

  const setCurrentSection = useCallback((index: number) => {
    progressTracker.setCurrentSection(index);
  }, []);

  const isLessonComplete = useCallback((lessonId: string) => {
    return progressTracker.isLessonComplete(lessonId);
  }, []);

  const getLevelCompletedCount = useCallback((level: number) => {
    return progressTracker.getLevelCompletedCount(level);
  }, []);

  const reset = useCallback(() => {
    progressTracker.reset();
  }, []);

  return {
    ...state,
    markLessonComplete,
    setCurrentLesson,
    setCurrentSection,
    isLessonComplete,
    getLevelCompletedCount,
    reset,
  } as ProgressState & {
    markLessonComplete: (lessonId: string, level: number) => void;
    setCurrentLesson: (lessonId: string, sectionIndex?: number) => void;
    setCurrentSection: (index: number) => void;
    isLessonComplete: (lessonId: string) => boolean;
    getLevelCompletedCount: (level: number) => number;
    reset: () => void;
  };
}
