import type { Lesson } from '../core/lesson/types';

// Static imports for Level 0 lesson JSON files
import lesson01 from './lessons/level0/lesson-0.1.json';
import lesson02 from './lessons/level0/lesson-0.2.json';
import lesson03 from './lessons/level0/lesson-0.3.json';
import lesson04 from './lessons/level0/lesson-0.4.json';
import lesson05 from './lessons/level0/lesson-0.5.json';
import lesson06 from './lessons/level0/lesson-0.6.json';

export interface LevelMeta {
  id: number;
  title: string;
  subtitle: string;
  lessons: Lesson[];
}

const level0Lessons = [lesson01, lesson02, lesson03, lesson04, lesson05, lesson06] as Lesson[];

export const levels: LevelMeta[] = [
  {
    id: 0,
    title: 'Computers Are Not Magic',
    subtitle: 'Files, folders, paths, and what a terminal actually is',
    lessons: level0Lessons,
  },
];

export function getLessonById(id: string): Lesson | null {
  for (const level of levels) {
    const found = level.lessons.find((l) => l.id === id);
    if (found) return found;
  }
  return null;
}

export function getLevelForLesson(lessonId: string): LevelMeta | null {
  for (const level of levels) {
    if (level.lessons.some((l) => l.id === lessonId)) return level;
  }
  return null;
}
