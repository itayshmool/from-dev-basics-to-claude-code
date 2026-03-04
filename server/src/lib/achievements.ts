export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'milestone' | 'mastery' | 'streak' | 'speed';
  check: (ctx: AchievementContext) => boolean;
  progress?: (ctx: AchievementContext) => number; // 0-1, for unearned
  earnedAt?: (ctx: AchievementContext) => string | null; // ISO timestamp
}

export interface AchievementContext {
  totalCompleted: number;
  totalLessons: number;
  completedLessonIds: Set<string>;
  /** Map of levelId → count of completed lessons in that level */
  completedPerLevel: Map<number, number>;
  /** Map of levelId → total lessons in that level */
  totalPerLevel: Map<number, number>;
  /** Sorted completion dates (ISO date strings, descending) */
  completionDates: string[];
  /** All completion timestamps sorted desc */
  completionTimestamps: (string | null)[];
  currentStreak: number;
  longestStreak: number;
  /** Map of date string → count of completions that day */
  completionsPerDay: Map<string, number>;
}

const LEVEL_COUNT = 8;

export const ACHIEVEMENTS: AchievementDef[] = [
  // Milestones
  {
    id: 'first_step',
    title: 'First Step',
    description: 'Complete your first lesson',
    icon: '\u{1F476}',
    category: 'milestone',
    check: (ctx) => ctx.totalCompleted >= 1,
    progress: (ctx) => Math.min(ctx.totalCompleted / 1, 1),
  },
  {
    id: 'getting_started',
    title: 'Getting Started',
    description: 'Complete 5 lessons',
    icon: '\u{1F331}',
    category: 'milestone',
    check: (ctx) => ctx.totalCompleted >= 5,
    progress: (ctx) => Math.min(ctx.totalCompleted / 5, 1),
  },
  {
    id: 'making_progress',
    title: 'Making Progress',
    description: 'Complete 25 lessons',
    icon: '\u{1F4AA}',
    category: 'milestone',
    check: (ctx) => ctx.totalCompleted >= 25,
    progress: (ctx) => Math.min(ctx.totalCompleted / 25, 1),
  },
  {
    id: 'halfway_there',
    title: 'Halfway There',
    description: 'Complete 51 lessons',
    icon: '\u{1F3C3}',
    category: 'milestone',
    check: (ctx) => ctx.totalCompleted >= 51,
    progress: (ctx) => Math.min(ctx.totalCompleted / 51, 1),
  },
  {
    id: 'graduate',
    title: 'Graduate',
    description: 'Complete all 102 lessons',
    icon: '\u{1F393}',
    category: 'milestone',
    check: (ctx) => ctx.totalCompleted >= ctx.totalLessons,
    progress: (ctx) => ctx.totalLessons > 0 ? Math.min(ctx.totalCompleted / ctx.totalLessons, 1) : 0,
  },

  // Level Mastery (dynamically for levels 0-7)
  ...Array.from({ length: LEVEL_COUNT }, (_, i) => ({
    id: `level_${i}_complete`,
    title: `Level ${i} Master`,
    description: `Complete all lessons in Level ${i}`,
    icon: ['\u{1F4BB}', '\u{1F4DF}', '\u{1F4D6}', '\u{1F500}', '\u{2601}\uFE0F', '\u{1F528}', '\u{1F916}', '\u{1F680}'][i],
    category: 'mastery' as const,
    check: (ctx: AchievementContext) => {
      const done = ctx.completedPerLevel.get(i) || 0;
      const total = ctx.totalPerLevel.get(i) || 0;
      return total > 0 && done >= total;
    },
    progress: (ctx: AchievementContext) => {
      const done = ctx.completedPerLevel.get(i) || 0;
      const total = ctx.totalPerLevel.get(i) || 0;
      return total > 0 ? Math.min(done / total, 1) : 0;
    },
  })),

  // Streaks
  {
    id: 'streak_3',
    title: '3-Day Streak',
    description: 'Complete lessons 3 days in a row',
    icon: '\u{1F525}',
    category: 'streak',
    check: (ctx) => ctx.longestStreak >= 3,
    progress: (ctx) => Math.min(ctx.longestStreak / 3, 1),
  },
  {
    id: 'streak_7',
    title: '7-Day Streak',
    description: 'Complete lessons 7 days in a row',
    icon: '\u{1F525}\u{1F525}',
    category: 'streak',
    check: (ctx) => ctx.longestStreak >= 7,
    progress: (ctx) => Math.min(ctx.longestStreak / 7, 1),
  },
  {
    id: 'streak_30',
    title: '30-Day Streak',
    description: 'Complete lessons 30 days in a row',
    icon: '\u{2604}\uFE0F',
    category: 'streak',
    check: (ctx) => ctx.longestStreak >= 30,
    progress: (ctx) => Math.min(ctx.longestStreak / 30, 1),
  },

  // Speed
  {
    id: 'quick_learner',
    title: 'Quick Learner',
    description: 'Complete 5 lessons in a single day',
    icon: '\u{26A1}',
    category: 'speed',
    check: (ctx) => {
      for (const count of ctx.completionsPerDay.values()) {
        if (count >= 5) return true;
      }
      return false;
    },
    progress: (ctx) => {
      let max = 0;
      for (const count of ctx.completionsPerDay.values()) {
        max = Math.max(max, count);
      }
      return Math.min(max / 5, 1);
    },
  },
];
