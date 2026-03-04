import { Router } from 'express';
import { eq, and, desc, sql, asc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { progress, lessons, levels } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { ACHIEVEMENTS, type AchievementContext } from '../lib/achievements.js';

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

// GET /api/progress/stats — aggregated stats for current user
// IMPORTANT: must be before /:lessonId to avoid matching "stats" as a lessonId
progressRouter.get('/stats', async (req, res) => {
  const userId = req.user!.userId;

  // Completed lessons with timestamps
  const completedRows = await db.select({
    lessonId: progress.lessonId,
    completedAt: progress.completedAt,
  }).from(progress)
    .where(and(eq(progress.userId, userId), eq(progress.completed, true)))
    .orderBy(desc(progress.completedAt));

  const totalCompleted = completedRows.length;

  // Total lessons count
  const [totalRow] = await db.select({
    count: sql<number>`count(*)::int`,
  }).from(lessons).where(eq(lessons.isPublished, true));
  const totalLessons = totalRow.count;

  const completionPercent = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  // Streak calculation: consecutive calendar days with completions
  const completionDates = new Set(
    completedRows
      .filter(r => r.completedAt)
      .map(r => new Date(r.completedAt!).toISOString().slice(0, 10))
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);

    if (completionDates.has(dateStr)) {
      streak++;
      if (i <= 1 || currentStreak > 0) {
        currentStreak = streak;
      }
      longestStreak = Math.max(longestStreak, streak);
    } else {
      if (i === 0) continue; // Today might not have a completion yet
      if (currentStreak === 0 && streak === 0) continue;
      streak = 0;
    }
  }

  // Level breakdown
  const levelRows = await db.select({
    levelId: levels.id,
    title: levels.title,
    emoji: levels.emoji,
  }).from(levels).orderBy(asc(levels.order));

  const lessonCounts = await db.select({
    levelId: lessons.levelId,
    count: sql<number>`count(*)::int`,
  }).from(lessons)
    .where(eq(lessons.isPublished, true))
    .groupBy(lessons.levelId);

  const countMap = new Map(lessonCounts.map(r => [r.levelId, r.count]));

  // Count completed per level
  const completedLessonIds = new Set(completedRows.map(r => r.lessonId));
  const allLessons = await db.select({
    id: lessons.id,
    levelId: lessons.levelId,
  }).from(lessons).where(eq(lessons.isPublished, true));

  const completedPerLevel = new Map<number, number>();
  for (const l of allLessons) {
    if (completedLessonIds.has(l.id)) {
      completedPerLevel.set(l.levelId, (completedPerLevel.get(l.levelId) || 0) + 1);
    }
  }

  const levelBreakdown = levelRows.map(lv => ({
    level: lv.levelId,
    title: lv.title,
    emoji: lv.emoji,
    completed: completedPerLevel.get(lv.levelId) || 0,
    total: countMap.get(lv.levelId) || 0,
  }));

  // Recent activity (last 10 with lesson titles)
  const lessonTitles = new Map(
    (await db.select({ id: lessons.id, title: lessons.title }).from(lessons)).map(l => [l.id, l.title])
  );

  const recentActivity = completedRows.slice(0, 10).map(r => ({
    lessonId: r.lessonId,
    lessonTitle: lessonTitles.get(r.lessonId) || r.lessonId,
    completedAt: r.completedAt,
  }));

  res.json({
    totalCompleted,
    totalLessons,
    completionPercent,
    currentStreak,
    longestStreak,
    levelBreakdown,
    recentActivity,
  });
});

// GET /api/progress/achievements — computed achievements for current user
progressRouter.get('/achievements', async (req, res) => {
  const userId = req.user!.userId;

  const completedRows = await db.select({
    lessonId: progress.lessonId,
    completedAt: progress.completedAt,
  }).from(progress)
    .where(and(eq(progress.userId, userId), eq(progress.completed, true)))
    .orderBy(desc(progress.completedAt));

  const allLessons = await db.select({
    id: lessons.id,
    levelId: lessons.levelId,
  }).from(lessons).where(eq(lessons.isPublished, true));

  const [totalRow] = await db.select({
    count: sql<number>`count(*)::int`,
  }).from(lessons).where(eq(lessons.isPublished, true));

  const completedLessonIds = new Set(completedRows.map(r => r.lessonId));

  // Per-level counts
  const completedPerLevel = new Map<number, number>();
  const totalPerLevel = new Map<number, number>();
  for (const l of allLessons) {
    totalPerLevel.set(l.levelId, (totalPerLevel.get(l.levelId) || 0) + 1);
    if (completedLessonIds.has(l.id)) {
      completedPerLevel.set(l.levelId, (completedPerLevel.get(l.levelId) || 0) + 1);
    }
  }

  // Date-based stats
  const completionTimestamps = completedRows.map(r => r.completedAt?.toISOString() ?? null);
  const completionDates = [...new Set(
    completedRows
      .filter(r => r.completedAt)
      .map(r => r.completedAt!.toISOString().slice(0, 10))
  )].sort().reverse();

  const completionsPerDay = new Map<string, number>();
  for (const r of completedRows) {
    if (r.completedAt) {
      const d = r.completedAt.toISOString().slice(0, 10);
      completionsPerDay.set(d, (completionsPerDay.get(d) || 0) + 1);
    }
  }

  // Streak
  const dateSet = new Set(completionDates);
  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0, 10);
    if (dateSet.has(ds)) {
      streak++;
      if (i <= 1 || currentStreak > 0) currentStreak = streak;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      if (i === 0) continue;
      if (currentStreak === 0 && streak === 0) continue;
      streak = 0;
    }
  }

  const ctx: AchievementContext = {
    totalCompleted: completedRows.length,
    totalLessons: totalRow.count,
    completedLessonIds,
    completedPerLevel,
    totalPerLevel,
    completionDates,
    completionTimestamps,
    currentStreak,
    longestStreak,
    completionsPerDay,
  };

  const earned: { id: string; title: string; description: string; icon: string; category: string; earnedAt: string | null }[] = [];
  const available: { id: string; title: string; description: string; icon: string; category: string; progress: number }[] = [];

  for (const ach of ACHIEVEMENTS) {
    if (ach.check(ctx)) {
      // For earnedAt, use the earliest timestamp that could satisfy the condition
      // Simplified: use the Nth completion timestamp based on achievement type
      let earnedAt: string | null = null;
      if (completionTimestamps.length > 0) {
        earnedAt = completionTimestamps[completionTimestamps.length - 1] ?? completionTimestamps[0];
      }
      earned.push({
        id: ach.id,
        title: ach.title,
        description: ach.description,
        icon: ach.icon,
        category: ach.category,
        earnedAt,
      });
    } else {
      available.push({
        id: ach.id,
        title: ach.title,
        description: ach.description,
        icon: ach.icon,
        category: ach.category,
        progress: ach.progress ? ach.progress(ctx) : 0,
      });
    }
  }

  res.json({
    earned,
    available,
    totalEarned: earned.length,
    totalAvailable: ACHIEVEMENTS.length,
  });
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
