import type { Lesson } from '../core/lesson/types';

// Static imports for Level 0 lesson JSON files
import lesson01 from './lessons/level0/lesson-0.1.json';
import lesson02 from './lessons/level0/lesson-0.2.json';
import lesson03 from './lessons/level0/lesson-0.3.json';
import lesson04 from './lessons/level0/lesson-0.4.json';
import lesson05 from './lessons/level0/lesson-0.5.json';
import lesson06 from './lessons/level0/lesson-0.6.json';

// Static imports for Level 1 lesson JSON files
import lesson11 from './lessons/level1/lesson-1.1.json';
import lesson12 from './lessons/level1/lesson-1.2.json';
import lesson13 from './lessons/level1/lesson-1.3.json';
import lesson14 from './lessons/level1/lesson-1.4.json';
import lesson15 from './lessons/level1/lesson-1.5.json';
import lesson16 from './lessons/level1/lesson-1.6.json';
import lesson17 from './lessons/level1/lesson-1.7.json';
import lesson18 from './lessons/level1/lesson-1.8.json';
import lesson19 from './lessons/level1/lesson-1.9.json';
import lesson110 from './lessons/level1/lesson-1.10.json';
import lesson111 from './lessons/level1/lesson-1.11.json';
import lesson112 from './lessons/level1/lesson-1.12.json';

export interface LevelMeta {
  id: number;
  title: string;
  subtitle: string;
  lessons: Lesson[];
}

const level0Lessons = [lesson01, lesson02, lesson03, lesson04, lesson05, lesson06] as Lesson[];
const level1Lessons = [lesson11, lesson12, lesson13, lesson14, lesson15, lesson16, lesson17, lesson18, lesson19, lesson110, lesson111, lesson112] as Lesson[];

export const levels: LevelMeta[] = [
  {
    id: 0,
    title: 'Computers Are Not Magic',
    subtitle: 'Files, folders, paths, and what a terminal actually is',
    lessons: level0Lessons,
  },
  {
    id: 1,
    title: 'Your First 30 Minutes in the Terminal',
    subtitle: 'Navigate, create, and manage files like a developer',
    lessons: level1Lessons,
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
