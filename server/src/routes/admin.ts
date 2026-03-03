import { Router } from 'express';
import { eq, sql, desc, asc, and, gte } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { levels, lessons, users, progress } from '../db/schema.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

// GET /api/admin/stats
adminRouter.get('/stats', async (_req, res) => {
  const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
  const [completionCount] = await db.select({ count: sql<number>`count(*)::int` }).from(progress).where(eq(progress.completed, true));

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [activeCount] = await db.select({
    count: sql<number>`count(distinct ${progress.userId})::int`,
  }).from(progress).where(gte(progress.completedAt, sevenDaysAgo));

  const perLevel = await db.select({
    levelId: levels.id,
    levelTitle: levels.title,
    completions: sql<number>`count(${progress.id})::int`,
  }).from(levels)
    .leftJoin(lessons, eq(lessons.levelId, levels.id))
    .leftJoin(progress, and(eq(progress.lessonId, lessons.id), eq(progress.completed, true)))
    .groupBy(levels.id, levels.title)
    .orderBy(asc(levels.order));

  const [totalStudents] = await db.select({ count: sql<number>`count(*)::int` })
    .from(users).where(eq(users.role, 'student'));

  const completionsPerLevel = perLevel.map(row => ({
    levelId: row.levelId,
    levelTitle: row.levelTitle,
    completions: row.completions,
    totalPossible: totalStudents.count * (0), // calculated below
  }));

  // Get lesson counts per level for totalPossible
  const lessonCounts = await db.select({
    levelId: lessons.levelId,
    count: sql<number>`count(*)::int`,
  }).from(lessons)
    .where(eq(lessons.isPublished, true))
    .groupBy(lessons.levelId);

  const countMap = new Map(lessonCounts.map(r => [r.levelId, r.count]));
  for (const row of completionsPerLevel) {
    row.totalPossible = totalStudents.count * (countMap.get(row.levelId) ?? 0);
  }

  res.json({
    totalUsers: userCount.count,
    totalCompletions: completionCount.count,
    activeUsersLast7Days: activeCount.count,
    completionsPerLevel,
  });
});

// GET /api/admin/users
adminRouter.get('/users', async (_req, res) => {
  const rows = await db.select({
    id: users.id,
    username: users.username,
    displayName: users.displayName,
    role: users.role,
    createdAt: users.createdAt,
    lessonsCompleted: sql<number>`(
      select count(*) from progress
      where progress.user_id = ${users.id} and progress.completed = true
    )::int`,
  }).from(users)
    .orderBy(desc(users.createdAt));

  res.json(rows);
});

// GET /api/admin/users/:id/progress
adminRouter.get('/users/:id/progress', async (req, res) => {
  const rows = await db.select({
    lessonId: progress.lessonId,
    sectionIndex: progress.sectionIndex,
    completed: progress.completed,
    completedAt: progress.completedAt,
  }).from(progress)
    .where(eq(progress.userId, req.params.id));

  res.json(rows);
});

// GET /api/admin/levels — all levels including unpublished
adminRouter.get('/levels', async (_req, res) => {
  const rows = await db.select().from(levels).orderBy(asc(levels.order));
  res.json(rows);
});

const levelSchema = z.object({
  id: z.number().int(),
  title: z.string().min(1).max(200),
  subtitle: z.string().min(1).max(500),
  emoji: z.string().min(1).max(10),
  order: z.number().int(),
  isPublished: z.boolean().optional(),
});

// POST /api/admin/levels
adminRouter.post('/levels', async (req, res) => {
  const parsed = levelSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'Invalid level data');

  const [row] = await db.insert(levels).values({
    ...parsed.data,
    isPublished: parsed.data.isPublished ?? true,
  }).returning();

  res.status(201).json(row);
});

// PUT /api/admin/levels/:id
adminRouter.put('/levels/:id', async (req, res) => {
  const parsed = levelSchema.partial().safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'Invalid level data');

  const [row] = await db.update(levels)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(levels.id, parseInt(req.params.id)))
    .returning();

  if (!row) throw new AppError(404, 'Level not found');
  res.json(row);
});

// DELETE /api/admin/levels/:id
adminRouter.delete('/levels/:id', async (req, res) => {
  const levelId = parseInt(req.params.id);
  const [hasLessons] = await db.select({ count: sql<number>`count(*)::int` })
    .from(lessons).where(eq(lessons.levelId, levelId));

  if (hasLessons.count > 0) {
    throw new AppError(400, 'Cannot delete level with existing lessons');
  }

  await db.delete(levels).where(eq(levels.id, levelId));
  res.json({ ok: true });
});

// GET /api/admin/lessons
adminRouter.get('/lessons', async (req, res) => {
  const levelId = req.query.levelId ? parseInt(req.query.levelId as string) : null;

  let query = db.select().from(lessons).orderBy(asc(lessons.levelId), asc(lessons.order));

  if (levelId !== null) {
    const rows = await db.select().from(lessons)
      .where(eq(lessons.levelId, levelId))
      .orderBy(asc(lessons.order));
    res.json(rows);
    return;
  }

  res.json(await query);
});

const lessonSchema = z.object({
  id: z.string().min(1).max(10),
  levelId: z.number().int(),
  title: z.string().min(1).max(200),
  subtitle: z.string().min(1).max(500),
  type: z.enum(['conceptual', 'terminal', 'guide']),
  order: z.number().int(),
  initialFs: z.unknown().optional(),
  initialDir: z.string().optional(),
  commandsIntroduced: z.array(z.string()).optional(),
  sections: z.array(z.unknown()),
  completionMessage: z.string().optional(),
  milestone: z.unknown().optional(),
  nextLesson: z.string().nullable().optional(),
  isPublished: z.boolean().optional(),
});

// POST /api/admin/lessons
adminRouter.post('/lessons', async (req, res) => {
  const parsed = lessonSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'Invalid lesson data');

  const [row] = await db.insert(lessons).values({
    ...parsed.data,
    sections: parsed.data.sections,
    initialFs: parsed.data.initialFs ?? null,
    initialDir: parsed.data.initialDir ?? null,
    commandsIntroduced: parsed.data.commandsIntroduced ?? null,
    completionMessage: parsed.data.completionMessage ?? null,
    milestone: parsed.data.milestone ?? null,
    nextLesson: parsed.data.nextLesson ?? null,
    isPublished: parsed.data.isPublished ?? true,
  }).returning();

  res.status(201).json(row);
});

// PUT /api/admin/lessons/:id
adminRouter.put('/lessons/:id', async (req, res) => {
  const parsed = lessonSchema.partial().safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'Invalid lesson data');

  const [row] = await db.update(lessons)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(lessons.id, req.params.id))
    .returning();

  if (!row) throw new AppError(404, 'Lesson not found');
  res.json(row);
});

// DELETE /api/admin/lessons/:id
adminRouter.delete('/lessons/:id', async (req, res) => {
  await db.delete(lessons).where(eq(lessons.id, req.params.id));
  res.json({ ok: true });
});

// POST /api/admin/lessons/:id/duplicate
adminRouter.post('/lessons/:id/duplicate', async (req, res) => {
  const [source] = await db.select().from(lessons)
    .where(eq(lessons.id, req.params.id))
    .limit(1);

  if (!source) throw new AppError(404, 'Lesson not found');

  const newId = req.body.newId as string;
  if (!newId) throw new AppError(400, 'newId required');

  const [row] = await db.insert(lessons).values({
    ...source,
    id: newId,
    title: `${source.title} (copy)`,
    nextLesson: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  res.status(201).json(row);
});

// PUT /api/admin/lessons/reorder
adminRouter.put('/lessons/reorder', async (req, res) => {
  const { lessonIds } = req.body as { lessonIds: string[] };
  if (!Array.isArray(lessonIds)) throw new AppError(400, 'lessonIds array required');

  for (let i = 0; i < lessonIds.length; i++) {
    await db.update(lessons)
      .set({ order: i + 1, updatedAt: new Date() })
      .where(eq(lessons.id, lessonIds[i]));
  }

  res.json({ ok: true });
});
