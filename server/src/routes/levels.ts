import { Router } from 'express';
import { eq, asc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { levels, lessons } from '../db/schema.js';

export const levelsRouter = Router();
export const lessonsRouter = Router();

// GET /api/levels — all published levels with lesson summaries (no sections)
levelsRouter.get('/', async (_req, res) => {
  const allLevels = await db.select().from(levels)
    .where(eq(levels.isPublished, true))
    .orderBy(asc(levels.order));

  const allLessons = await db.select({
    id: lessons.id,
    levelId: lessons.levelId,
    title: lessons.title,
    subtitle: lessons.subtitle,
    type: lessons.type,
    order: lessons.order,
  }).from(lessons)
    .where(eq(lessons.isPublished, true))
    .orderBy(asc(lessons.order));

  const result = allLevels.map(level => ({
    id: level.id,
    title: level.title,
    subtitle: level.subtitle,
    emoji: level.emoji,
    order: level.order,
    lessons: allLessons
      .filter(l => l.levelId === level.id)
      .map(l => ({
        id: l.id,
        title: l.title,
        subtitle: l.subtitle,
        type: l.type,
        order: l.order,
      })),
  }));

  res.json(result);
});

// GET /api/lessons/:id — full lesson with sections
lessonsRouter.get('/:id', async (req, res) => {
  const [lesson] = await db.select().from(lessons)
    .where(eq(lessons.id, req.params.id))
    .limit(1);

  if (!lesson || !lesson.isPublished) {
    res.status(404).json({ error: 'Lesson not found' });
    return;
  }

  res.json({
    id: lesson.id,
    level: lesson.levelId,
    order: lesson.order,
    title: lesson.title,
    subtitle: lesson.subtitle,
    type: lesson.type,
    initialFs: lesson.initialFs,
    initialDir: lesson.initialDir,
    commandsIntroduced: lesson.commandsIntroduced,
    sections: lesson.sections,
    completionMessage: lesson.completionMessage,
    milestone: lesson.milestone,
    nextLesson: lesson.nextLesson,
  });
});
