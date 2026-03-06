import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Lessons that should end with a quiz or fillInBlank (excludes freeMode challenges)
const LESSONS_WITH_END_QUIZ: Array<{ level: number; lessons: number[] }> = [
  { level: 1, lessons: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  { level: 2, lessons: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
];

describe('L1-L2 end-of-lesson recall sections (#64)', () => {
  for (const { level, lessons } of LESSONS_WITH_END_QUIZ) {
    for (const num of lessons) {
      const filePath = join(__dirname, `level${level}`, `lesson-${level}.${num}.json`);

      it(`lesson ${level}.${num} ends with a quiz or fillInBlank`, () => {
        const raw = readFileSync(filePath, 'utf-8');
        const lesson = JSON.parse(raw);
        const sections = lesson.sections;

        expect(sections.length).toBeGreaterThanOrEqual(2);

        const last = sections[sections.length - 1];
        expect(['quiz', 'fillInBlank']).toContain(last.type);
      });

      it(`lesson ${level}.${num} end section has valid fields`, () => {
        const raw = readFileSync(filePath, 'utf-8');
        const lesson = JSON.parse(raw);
        const last = lesson.sections[lesson.sections.length - 1];

        if (last.type === 'quiz') {
          expect(last.question).toBeDefined();
          expect(last.options).toBeDefined();
          expect(last.options.length).toBeGreaterThanOrEqual(3);
          expect(typeof last.correctIndex).toBe('number');
          expect(last.explanation).toBeDefined();
        } else {
          expect(last.prompt).toBeDefined();
          expect(last.answer).toBeDefined();
        }
      });
    }
  }
});
