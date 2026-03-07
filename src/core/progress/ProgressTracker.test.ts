// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { ProgressTracker } from './ProgressTracker';

describe('ProgressTracker', () => {
  let tracker: ProgressTracker;

  beforeEach(() => {
    localStorage.clear();
    tracker = new ProgressTracker();
  });

  it('starts with default state', () => {
    const state = tracker.getState();
    expect(state.completedLessons).toEqual([]);
    expect(state.currentLessonId).toBe('0.1');
    expect(state.currentSectionIndex).toBe(0);
  });

  it('marks a lesson complete', () => {
    tracker.markLessonComplete('1.1', 1);
    expect(tracker.isLessonComplete('1.1')).toBe(true);
    expect(tracker.isLessonComplete('1.2')).toBe(false);
  });

  it('tracks level progress incrementally', () => {
    const before = tracker.getLevelCompletedCount(5);
    tracker.markLessonComplete('5.1', 5);
    tracker.markLessonComplete('5.2', 5);
    expect(tracker.getLevelCompletedCount(5)).toBe(before + 2);
  });

  it('stores completion dates', () => {
    tracker.markLessonComplete('1.1', 1);
    const state = tracker.getState();
    expect(state.completionDates).toBeDefined();
    expect(state.completionDates!['1.1']).toBeDefined();
    // Should be a valid ISO date
    const date = new Date(state.completionDates!['1.1']);
    expect(date.getTime()).not.toBeNaN();
  });

  it('does not overwrite existing completion date', () => {
    tracker.markLessonComplete('1.1', 1);
    const firstDate = tracker.getState().completionDates!['1.1'];

    // Mark again
    tracker.markLessonComplete('1.1', 1);
    expect(tracker.getState().completionDates!['1.1']).toBe(firstDate);
  });

  it('sets current lesson and section', () => {
    tracker.setCurrentLesson('2.3', 5);
    const state = tracker.getState();
    expect(state.currentLessonId).toBe('2.3');
    expect(state.currentSectionIndex).toBe(5);
  });

  it('updates current section', () => {
    tracker.setCurrentSection(3);
    expect(tracker.getState().currentSectionIndex).toBe(3);
  });

  it('resets to defaults', () => {
    tracker.markLessonComplete('1.1', 1);
    tracker.reset();
    expect(tracker.getState().completedLessons).toEqual([]);
    expect(tracker.isLessonComplete('1.1')).toBe(false);
  });

  it('persists to localStorage and loads back', () => {
    tracker.markLessonComplete('1.1', 1);
    tracker.setCurrentLesson('1.2', 2);

    // Create new tracker — should load from storage
    const tracker2 = new ProgressTracker();
    expect(tracker2.isLessonComplete('1.1')).toBe(true);
    expect(tracker2.getState().currentLessonId).toBe('1.2');
    expect(tracker2.getState().currentSectionIndex).toBe(2);
  });

  it('notifies subscribers on state change', () => {
    let notified = false;
    tracker.subscribe(() => { notified = true; });
    tracker.markLessonComplete('1.1', 1);
    expect(notified).toBe(true);
  });

  it('unsubscribes cleanly', () => {
    let count = 0;
    const unsub = tracker.subscribe(() => { count++; });
    tracker.markLessonComplete('1.1', 1);
    expect(count).toBe(1);

    unsub();
    tracker.markLessonComplete('1.2', 1);
    expect(count).toBe(1); // no additional notification
  });

  describe('getReviewLessons', () => {
    it('returns empty when no completions', () => {
      expect(tracker.getReviewLessons()).toEqual([]);
    });

    it('returns empty for recent completions', () => {
      tracker.markLessonComplete('1.1', 1);
      expect(tracker.getReviewLessons()).toEqual([]);
    });

    it('returns lessons completed 3+ days ago', () => {
      // Manually set an old completion date
      const state = tracker.getState();
      state.completionDates = {
        '1.1': new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      };
      state.completedLessons = ['1.1'];
      // Trigger save by calling a method
      tracker.setCurrentSection(0);

      expect(tracker.getReviewLessons()).toEqual(['1.1']);
    });

    it('returns at most 5 lessons', () => {
      const state = tracker.getState();
      const oldDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      state.completionDates = {};
      state.completedLessons = [];
      for (let i = 1; i <= 8; i++) {
        state.completionDates[`1.${i}`] = oldDate;
        state.completedLessons.push(`1.${i}`);
      }
      tracker.setCurrentSection(0);

      expect(tracker.getReviewLessons().length).toBe(5);
    });

    it('sorts oldest-first', () => {
      const state = tracker.getState();
      state.completionDates = {
        '1.1': new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        '1.2': new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      };
      state.completedLessons = ['1.1', '1.2'];
      tracker.setCurrentSection(0);

      const review = tracker.getReviewLessons();
      expect(review[0]).toBe('1.2'); // older first
      expect(review[1]).toBe('1.1');
    });
  });
});
