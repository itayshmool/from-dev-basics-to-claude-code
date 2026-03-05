import type { Lesson } from '../core/lesson/types';

const USE_API = import.meta.env.VITE_USE_API === 'true';
const API_URL = import.meta.env.VITE_API_URL || '';

export interface LevelSummary {
  id: number;
  title: string;
  subtitle: string;
  emoji: string;
  order: number;
  lessons: {
    id: string;
    title: string;
    subtitle: string;
    type: string;
    order: number;
  }[];
}

export async function fetchLevels(): Promise<LevelSummary[]> {
  if (!USE_API) {
    const { levels } = await import('../data/levels');
    return levels.map((l, idx) => ({
      id: l.id,
      title: l.title,
      subtitle: l.subtitle,
      emoji: '',
      order: idx,
      lessons: l.lessons.map(les => ({
        id: les.id,
        title: les.title,
        subtitle: les.subtitle,
        type: les.type,
        order: les.order,
      })),
    }));
  }

  const res = await fetch(`${API_URL}/api/levels`);
  if (!res.ok) throw new Error('Failed to fetch levels');
  return res.json();
}

export async function fetchLesson(id: string): Promise<Lesson | null> {
  if (!USE_API) {
    const { getLessonById } = await import('../data/levels');
    return getLessonById(id);
  }

  const res = await fetch(`${API_URL}/api/lessons/${id}`);
  if (!res.ok) return null;
  return res.json();
}
