import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function maxConsecutiveSameType(types: string[]): { type: string; count: number } {
  let maxType = '';
  let maxCount = 0;
  let currentType = '';
  let currentCount = 0;

  for (const t of types) {
    if (t === currentType) {
      currentCount++;
    } else {
      currentType = t;
      currentCount = 1;
    }
    if (currentCount > maxCount) {
      maxCount = currentCount;
      maxType = currentType;
    }
  }
  return { type: maxType, count: maxCount };
}

describe('Lesson section variety (#65)', () => {
  for (const level of [1, 2, 3]) {
    const levelDir = join(__dirname, `level${level}`);
    const files = readdirSync(levelDir)
      .filter(f => f.startsWith('lesson-') && f.endsWith('.json'))
      .sort();

    for (const file of files) {
      const filePath = join(levelDir, file);
      const lessonId = file.replace('lesson-', '').replace('.json', '');

      it(`lesson ${lessonId} has no more than 4 consecutive same-type sections`, () => {
        const raw = readFileSync(filePath, 'utf-8');
        const lesson = JSON.parse(raw);
        const types = lesson.sections.map((s: { type: string }) => s.type);
        const { type, count } = maxConsecutiveSameType(types);

        expect(count).toBeLessThanOrEqual(4,
          `${lessonId} has ${count} consecutive "${type}" sections`);
      });
    }
  }

  describe('Level 3 narrative coverage', () => {
    const levelDir = join(__dirname, 'level3');
    const files = readdirSync(levelDir)
      .filter(f => f.startsWith('lesson-') && f.endsWith('.json'))
      .sort();

    for (const file of files) {
      const filePath = join(levelDir, file);
      const lessonId = file.replace('lesson-', '').replace('.json', '');

      it(`lesson ${lessonId} starts with a narrative section`, () => {
        const raw = readFileSync(filePath, 'utf-8');
        const lesson = JSON.parse(raw);

        expect(lesson.sections[0].type).toBe('narrative');
      });
    }
  });
});
