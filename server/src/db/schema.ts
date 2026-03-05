import {
  pgTable,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  serial,
  uuid,
  unique,
} from 'drizzle-orm/pg-core';

export const levels = pgTable('levels', {
  id: integer('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  subtitle: varchar('subtitle', { length: 500 }).notNull(),
  order: integer('order').notNull(),
  emoji: varchar('emoji', { length: 10 }).notNull(),
  isPublished: boolean('is_published').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const lessons = pgTable('lessons', {
  id: varchar('id', { length: 10 }).primaryKey(),
  levelId: integer('level_id').notNull().references(() => levels.id),
  title: varchar('title', { length: 200 }).notNull(),
  subtitle: varchar('subtitle', { length: 500 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  order: integer('order').notNull(),
  initialFs: jsonb('initial_fs'),
  initialDir: varchar('initial_dir', { length: 500 }),
  commandsIntroduced: jsonb('commands_introduced'),
  sections: jsonb('sections').notNull(),
  completionMessage: text('completion_message'),
  milestone: jsonb('milestone'),
  nextLesson: varchar('next_lesson', { length: 10 }),
  isPublished: boolean('is_published').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('student'),
  email: varchar('email', { length: 255 }),
  profileImage: text('profile_image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const progress = pgTable('progress', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  lessonId: varchar('lesson_id', { length: 10 }).notNull().references(() => lessons.id),
  sectionIndex: integer('section_index').notNull().default(0),
  completed: boolean('completed').notNull().default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
  userLessonUnique: unique('progress_user_lesson_unique').on(table.userId, table.lessonId),
}));

export const siteSettings = pgTable('site_settings', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
