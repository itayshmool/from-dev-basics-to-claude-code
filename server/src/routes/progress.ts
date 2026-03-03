import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { progress } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const progressRouter = Router();

progressRouter.use(requireAuth);

// GET /api/progress — all progress for current user
progressRouter.get('/', async (req, res) => {
  const rows = await db.select({
    lessonId: progress.lessonId,
    sectionIndex: progress.sectionIndex,
    completed: progress.completed,
    completedAt: progress.completedAt,
  }).from(progress)
    .where(eq(progress.userId, req.user!.userId));

  res.json(rows);
});

const updateSchema = z.object({
  sectionIndex: z.number().int().min(0),
  completed: z.boolean(),
});

// PUT /api/progress/:lessonId — upsert progress
progressRouter.put('/:lessonId', async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'Invalid progress data');
  }

  const { sectionIndex, completed } = parsed.data;
  const { lessonId } = req.params;
  const userId = req.user!.userId;

  // Upsert: insert or update
  const [existing] = await db.select({ id: progress.id })
    .from(progress)
    .where(and(eq(progress.userId, userId), eq(progress.lessonId, lessonId)))
    .limit(1);

  if (existing) {
    await db.update(progress)
      .set({
        sectionIndex,
        completed,
        completedAt: completed ? new Date() : null,
      })
      .where(eq(progress.id, existing.id));
  } else {
    await db.insert(progress).values({
      userId,
      lessonId,
      sectionIndex,
      completed,
      completedAt: completed ? new Date() : null,
    });
  }

  res.json({ lessonId, sectionIndex, completed });
});
