import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../lib/env.js';
import { hashPassword } from '../lib/password.js';
import { levels, lessons, users } from './schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LEVEL_META = [
  { id: 0, title: 'Computers Are Not Magic', subtitle: 'Files, folders, paths, and what a terminal actually is', emoji: '\u{1F4BB}' },
  { id: 1, title: 'Your First 30 Minutes in the Terminal', subtitle: 'Navigate, create, and manage files like a developer', emoji: '\u{1F4DF}' },
  { id: 2, title: 'Reading and Writing Files', subtitle: 'Look inside files, search for text, and chain commands together', emoji: '\u{1F4D6}' },
  { id: 3, title: 'Your Code Has a History', subtitle: 'Git and GitHub \u2014 never lose your work again', emoji: '\u{1F500}' },
  { id: 4, title: 'How Software Actually Works', subtitle: 'Client, server, APIs, databases, and the cloud \u2014 demystified', emoji: '\u2601\uFE0F' },
  { id: 5, title: 'Building With Real Tools', subtitle: 'Install Node.js, run code, build a real server', emoji: '\u{1F528}' },
  { id: 6, title: 'Claude Code \u2014 Your AI Pair Programmer', subtitle: 'Build real projects by describing what you want', emoji: '\u{1F916}' },
  { id: 7, title: 'Junior Developer Patterns', subtitle: 'Debug, deploy, and work like a professional', emoji: '\u{1F680}' },
];

interface LessonJson {
  id: string;
  level: number;
  order: number;
  title: string;
  subtitle: string;
  type: string;
  initialFs?: unknown;
  initialDir?: string;
  commandsIntroduced?: string[];
  sections: unknown[];
  completionMessage?: string;
  milestone?: unknown;
  nextLesson: string | null;
}

async function main() {
  const client = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  console.log('Seeding database...');

  // 1. Insert levels
  for (const meta of LEVEL_META) {
    await db.insert(levels).values({
      id: meta.id,
      title: meta.title,
      subtitle: meta.subtitle,
      order: meta.id,
      emoji: meta.emoji,
      isPublished: true,
    }).onConflictDoNothing();
  }
  console.log(`Seeded ${LEVEL_META.length} levels.`);

  // 2. Read and insert all lessons
  const lessonsDir = path.resolve(__dirname, '../../../src/data/lessons');
  let lessonCount = 0;

  for (const meta of LEVEL_META) {
    const levelDir = path.join(lessonsDir, `level${meta.id}`);
    if (!fs.existsSync(levelDir)) {
      console.warn(`  Skipping level ${meta.id}: directory not found at ${levelDir}`);
      continue;
    }

    const files = fs.readdirSync(levelDir)
      .filter(f => f.endsWith('.json'))
      .sort((a, b) => {
        const numA = parseFloat(a.match(/lesson-(\d+\.\d+)/)?.[1] || '0');
        const numB = parseFloat(b.match(/lesson-(\d+\.\d+)/)?.[1] || '0');
        return numA - numB;
      });

    for (const file of files) {
      const raw = fs.readFileSync(path.join(levelDir, file), 'utf-8');
      const lesson: LessonJson = JSON.parse(raw);

      await db.insert(lessons).values({
        id: lesson.id,
        levelId: lesson.level,
        title: lesson.title,
        subtitle: lesson.subtitle,
        type: lesson.type,
        order: lesson.order,
        initialFs: lesson.initialFs ?? null,
        initialDir: lesson.initialDir ?? null,
        commandsIntroduced: lesson.commandsIntroduced ?? null,
        sections: lesson.sections,
        completionMessage: lesson.completionMessage ?? null,
        milestone: lesson.milestone ?? null,
        nextLesson: lesson.nextLesson,
        isPublished: true,
      }).onConflictDoNothing();

      lessonCount++;
    }
  }
  console.log(`Seeded ${lessonCount} lessons.`);

  // 3. Create admin user
  if (env.ADMIN_PASSWORD) {
    const hash = await hashPassword(env.ADMIN_PASSWORD);
    await db.insert(users).values({
      username: 'admin',
      passwordHash: hash,
      displayName: 'Administrator',
      role: 'admin',
    }).onConflictDoNothing();
    console.log('Created admin user.');
  } else {
    console.log('Skipping admin user (ADMIN_PASSWORD not set).');
  }

  console.log('Seed complete.');
  await client.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
