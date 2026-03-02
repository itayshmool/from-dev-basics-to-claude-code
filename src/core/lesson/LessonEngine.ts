import type { Lesson, LessonSection, QuizSection, FillInBlankSection, MatchSection } from './types';

export type ValidationResult = { valid: boolean; message?: string };

export class LessonEngine {
  private lesson: Lesson;
  private sectionIndex: number;
  private sectionCompleted: boolean[];
  private listeners: Set<() => void> = new Set();

  constructor(lesson: Lesson, startIndex = 0) {
    this.lesson = lesson;
    this.sectionIndex = startIndex;
    this.sectionCompleted = lesson.sections.map(() => false);
    // Mark sections before startIndex as completed
    for (let i = 0; i < startIndex && i < this.sectionCompleted.length; i++) {
      this.sectionCompleted[i] = true;
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  getLesson(): Lesson {
    return this.lesson;
  }

  getCurrentSectionIndex(): number {
    return this.sectionIndex;
  }

  getCurrentSection(): LessonSection | null {
    return this.lesson.sections[this.sectionIndex] ?? null;
  }

  isSectionCompleted(index: number): boolean {
    return this.sectionCompleted[index] ?? false;
  }

  isCurrentSectionCompleted(): boolean {
    return this.sectionCompleted[this.sectionIndex] ?? false;
  }

  isLessonComplete(): boolean {
    return this.sectionIndex >= this.lesson.sections.length;
  }

  markCurrentSectionComplete(): void {
    this.sectionCompleted[this.sectionIndex] = true;
    this.notify();
  }

  advance(): void {
    if (this.sectionIndex < this.lesson.sections.length) {
      this.sectionCompleted[this.sectionIndex] = true;
      this.sectionIndex++;
      this.notify();
    }
  }

  validateQuiz(section: QuizSection, selectedIndex: number): ValidationResult {
    if (selectedIndex === section.correctIndex) {
      return { valid: true, message: section.explanation };
    }
    return { valid: false, message: 'Not quite. Try again!' };
  }

  validateFillInBlank(section: FillInBlankSection, answer: string): ValidationResult {
    const normalize = (s: string) => section.caseSensitive ? s.trim() : s.trim().toLowerCase();
    const normalized = normalize(answer);
    const correct = normalize(section.answer);
    const alternates = (section.acceptAlternates || []).map(normalize);

    if (normalized === correct || alternates.includes(normalized)) {
      return { valid: true };
    }
    return { valid: false, message: `The answer is "${section.answer}".` };
  }

  validateMatch(section: MatchSection, pairs: Array<{ left: string; right: string }>): ValidationResult {
    const allCorrect = section.pairs.every((expected) =>
      pairs.some((p) => p.left === expected.left && p.right === expected.right)
    );
    if (allCorrect && pairs.length === section.pairs.length) {
      return { valid: true };
    }
    return { valid: false };
  }
}
