import { Router } from 'express';
import { eq, sql, desc, asc, and, gte } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { levels, lessons, users, progress, siteSettings, palettes, emailLog } from '../db/schema.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { signAccessToken } from '../lib/jwt.js';
import { generatePalette } from '../lib/paletteGenerator.js';

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
    totalPossible: 0,
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
      where progress.user_id = "users"."id" and progress.completed = true
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

// GET /api/admin/settings/:key
adminRouter.get('/settings/:key', async (req, res) => {
  const [row] = await db.select().from(siteSettings)
    .where(eq(siteSettings.key, req.params.key));

  if (!row) throw new AppError(404, 'Setting not found');
  res.json(row);
});

// PUT /api/admin/settings/:key
adminRouter.put('/settings/:key', async (req, res) => {
  const { value } = req.body;
  if (value === undefined) throw new AppError(400, 'value required');

  const [row] = await db.insert(siteSettings)
    .values({ key: req.params.key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value, updatedAt: new Date() },
    })
    .returning();

  res.json(row);
});

// POST /api/admin/impersonate/:userId
adminRouter.post('/impersonate/:userId', async (req, res) => {
  const [target] = await db.select({
    id: users.id,
    username: users.username,
    displayName: users.displayName,
    role: users.role,
  }).from(users)
    .where(eq(users.id, req.params.userId))
    .limit(1);

  if (!target) throw new AppError(404, 'User not found');
  if (target.role !== 'student') throw new AppError(400, 'Can only impersonate students');

  const accessToken = signAccessToken({
    userId: target.id,
    role: 'student',
    impersonatedBy: req.user!.userId,
  });

  res.json({
    accessToken,
    user: { id: target.id, username: target.username, displayName: target.displayName, role: target.role },
  });
});

// DELETE /api/admin/settings/:key
adminRouter.delete('/settings/:key', async (req, res) => {
  await db.delete(siteSettings).where(eq(siteSettings.key, req.params.key));
  res.json({ ok: true });
});

// ─── Palette management ───

const paletteSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  colors: z.object({
    dark: z.record(z.string(), z.string()),
    light: z.record(z.string(), z.string()),
  }),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().optional(),
});

// GET /api/admin/palettes — all palettes including inactive
adminRouter.get('/palettes', asyncHandler(async (_req, res) => {
  const rows = await db.select().from(palettes).orderBy(asc(palettes.order));
  res.json(rows);
}));

// POST /api/admin/palettes — create palette
adminRouter.post('/palettes', asyncHandler(async (req, res) => {
  const parsed = paletteSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'Invalid palette data');

  // Check slug uniqueness
  const [existing] = await db.select({ id: palettes.id })
    .from(palettes).where(eq(palettes.slug, parsed.data.slug)).limit(1);
  if (existing) throw new AppError(409, 'A palette with this slug already exists');

  const [row] = await db.insert(palettes).values({
    name: parsed.data.name,
    slug: parsed.data.slug,
    colors: parsed.data.colors,
    isDefault: parsed.data.isDefault ?? false,
    isActive: parsed.data.isActive ?? true,
    order: parsed.data.order ?? 0,
  }).returning();

  res.status(201).json(row);
}));

// PUT /api/admin/palettes/:id — update palette
adminRouter.put('/palettes/reorder', asyncHandler(async (req, res) => {
  const { items } = req.body as { items: { id: string; order: number }[] };
  if (!Array.isArray(items)) throw new AppError(400, 'items array required');

  for (const item of items) {
    await db.update(palettes)
      .set({ order: item.order })
      .where(eq(palettes.id, item.id));
  }

  res.json({ ok: true });
}));

adminRouter.put('/palettes/:id', asyncHandler(async (req, res) => {
  const parsed = paletteSchema.partial().safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'Invalid palette data');

  // If changing slug, check uniqueness
  if (parsed.data.slug) {
    const [existing] = await db.select({ id: palettes.id })
      .from(palettes)
      .where(and(eq(palettes.slug, parsed.data.slug), sql`${palettes.id} != ${req.params.id}`))
      .limit(1);
    if (existing) throw new AppError(409, 'A palette with this slug already exists');
  }

  const [row] = await db.update(palettes)
    .set(parsed.data)
    .where(eq(palettes.id, req.params.id))
    .returning();

  if (!row) throw new AppError(404, 'Palette not found');
  res.json(row);
}));

// DELETE /api/admin/palettes/:id — delete palette
adminRouter.delete('/palettes/:id', asyncHandler(async (req, res) => {
  // Block deletion of default palette
  const [palette] = await db.select({ id: palettes.id, isDefault: palettes.isDefault })
    .from(palettes).where(eq(palettes.id, req.params.id)).limit(1);

  if (!palette) throw new AppError(404, 'Palette not found');
  if (palette.isDefault) throw new AppError(400, 'Cannot delete the default palette');

  // Check if any users have this palette selected — reset them to null
  await db.update(users)
    .set({ paletteId: null })
    .where(eq(users.paletteId, req.params.id));

  await db.delete(palettes).where(eq(palettes.id, req.params.id));
  res.json({ ok: true });
}));

// PUT /api/admin/palettes/:id/default — set as default
adminRouter.put('/palettes/:id/default', asyncHandler(async (req, res) => {
  const [palette] = await db.select({ id: palettes.id })
    .from(palettes).where(eq(palettes.id, req.params.id)).limit(1);

  if (!palette) throw new AppError(404, 'Palette not found');

  // Unset all other defaults
  await db.update(palettes).set({ isDefault: false }).where(eq(palettes.isDefault, true));

  // Set new default
  const [row] = await db.update(palettes)
    .set({ isDefault: true })
    .where(eq(palettes.id, req.params.id))
    .returning();

  res.json(row);
}));

// POST /api/admin/palettes/generate — AI palette generation
adminRouter.post('/palettes/generate', asyncHandler(async (req, res) => {
  const { hint } = req.body as { hint?: string };

  try {
    const result = await generatePalette(hint, req.user!.userId);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    if (message.includes('Rate limit')) throw new AppError(429, message);
    if (message.includes('not configured')) throw new AppError(503, message);
    throw new AppError(500, `AI generation failed: ${message}`);
  }
}));

// ─── Email log ───

// GET /api/admin/email/log — paginated send history
adminRouter.get('/email/log', asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const typeFilter = req.query.type as string | undefined;
  const offset = (page - 1) * limit;

  const conditions = typeFilter ? eq(emailLog.emailType, typeFilter) : undefined;

  const [countResult] = await db.select({ count: sql<number>`count(*)::int` })
    .from(emailLog)
    .where(conditions);

  const logs = await db.select()
    .from(emailLog)
    .where(conditions)
    .orderBy(desc(emailLog.createdAt))
    .limit(limit)
    .offset(offset);

  res.json({ logs, total: countResult.count, page, limit });
}));

// GET /api/admin/email/log/stats — aggregate counts
adminRouter.get('/email/log/stats', asyncHandler(async (_req, res) => {
  const byType = await db.select({
    emailType: emailLog.emailType,
    count: sql<number>`count(*)::int`,
  }).from(emailLog).groupBy(emailLog.emailType);

  const byStatus = await db.select({
    status: emailLog.status,
    count: sql<number>`count(*)::int`,
  }).from(emailLog).groupBy(emailLog.status);

  const [totalResult] = await db.select({ count: sql<number>`count(*)::int` }).from(emailLog);

  const byTypeMap: Record<string, number> = {};
  for (const row of byType) byTypeMap[row.emailType] = row.count;

  const byStatusMap: Record<string, number> = {};
  for (const row of byStatus) byStatusMap[row.status] = row.count;

  res.json({ byType: byTypeMap, byStatus: byStatusMap, total: totalResult.count });
}));
