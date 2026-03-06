import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LEVELS = [1, 2];
const LESSONS_PER_LEVEL = 12;

describe('Level 1-2 lesson narrative intros (#62)', () => {
  for (const level of LEVELS) {
    for (let i = 1; i <= LESSONS_PER_LEVEL; i++) {
      const filePath = join(__dirname, `level${level}`, `lesson-${level}.${i}.json`);

      it(`lesson ${level}.${i} has a narrative intro as first section`, () => {
        const raw = readFileSync(filePath, 'utf-8');
        const lesson = JSON.parse(raw);

        expect(lesson.sections).toBeDefined();
        expect(lesson.sections.length).toBeGreaterThanOrEqual(2);

        const first = lesson.sections[0];
        expect(first.type).toBe('narrative');
        expect(first.content).toBeDefined();
        expect(typeof first.content).toBe('string');
        expect(first.content.length).toBeGreaterThan(10);
      });

      it(`lesson ${level}.${i} narrative has analogy and keyPoints`, () => {
        const raw = readFileSync(filePath, 'utf-8');
        const lesson = JSON.parse(raw);
        const first = lesson.sections[0];

        expect(first.analogy).toBeDefined();
        expect(typeof first.analogy).toBe('string');
        expect(first.keyPoints).toBeDefined();
        expect(Array.isArray(first.keyPoints)).toBe(true);
        expect(first.keyPoints.length).toBeGreaterThanOrEqual(3);
      });
    }
  }
});
