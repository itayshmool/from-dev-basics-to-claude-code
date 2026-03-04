import { STORAGE_KEY } from '../../lib/constants';
import type { ProgressState } from './types';

const PROGRESS_VERSION = 1;

const DEFAULT_STATE: ProgressState = {
  completedLessons: [],
  currentLessonId: '0.1',
  currentSectionIndex: 0,
  levelProgress: {},
  version: PROGRESS_VERSION,
};

export class ProgressTracker {
  private state: ProgressState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.load();
  }

  private load(): ProgressState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ProgressState;
        if (parsed.version !== PROGRESS_VERSION) {
          // Schema migration: preserve completed lessons but reset current position
          return { ...DEFAULT_STATE, completedLessons: parsed.completedLessons ?? [], levelProgress: parsed.levelProgress ?? {} };
        }
        return parsed;
      }
    } catch {
      // corrupt data, reset
    }
    return { ...DEFAULT_STATE };
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    this.listeners.forEach((fn) => fn());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): ProgressState {
    return this.state;
  }

  isLessonComplete(lessonId: string): boolean {
    return this.state.completedLessons.includes(lessonId);
  }

  markLessonComplete(lessonId: string, level: number): void {
    if (!this.state.completedLessons.includes(lessonId)) {
      this.state.completedLessons = [...this.state.completedLessons, lessonId];
      this.state.levelProgress[level] = (this.state.levelProgress[level] || 0) + 1;
    }
    this.save();
  }

  setCurrentLesson(lessonId: string, sectionIndex = 0): void {
    this.state.currentLessonId = lessonId;
    this.state.currentSectionIndex = sectionIndex;
    this.save();
  }

  setCurrentSection(index: number): void {
    this.state.currentSectionIndex = index;
    this.save();
  }

  getLevelCompletedCount(level: number): number {
    return this.state.levelProgress[level] || 0;
  }

  reset(): void {
    this.state = { ...DEFAULT_STATE };
    this.save();
  }
}

export const progressTracker = new ProgressTracker();
