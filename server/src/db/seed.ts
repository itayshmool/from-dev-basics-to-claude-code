import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../lib/env.js';
import { hashPassword } from '../lib/password.js';
import { levels, lessons, users, palettes } from './schema.js';

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

  // 4. Seed palettes
  const SEED_PALETTES = [
    {
      name: 'Terminal Noir',
      slug: 'terminal-noir',
      isDefault: true,
      order: 0,
      colors: {
        dark: {
          '--color-bg-primary': '#09090B',
          '--color-bg-secondary': '#0F0F13',
          '--color-bg-card': '#141419',
          '--color-bg-elevated': '#1C1C24',
          '--color-text-primary': '#EAEAEC',
          '--color-text-secondary': '#8E8E9E',
          '--color-text-muted': '#78788A',
          '--color-purple': '#FF6B35',
          '--color-green': '#22C55E',
          '--color-blue': '#3B82F6',
          '--color-red': '#EF4444',
          '--color-yellow': '#EAB308',
          '--color-border': 'rgba(255, 255, 255, 0.06)',
          '--color-border-strong': 'rgba(255, 255, 255, 0.12)',
        },
        light: {
          '--color-bg-primary': '#FAFAF8',
          '--color-bg-secondary': '#F3F1EE',
          '--color-bg-card': '#FFFFFF',
          '--color-bg-elevated': '#EDECEA',
          '--color-text-primary': '#1A1A1B',
          '--color-text-secondary': '#5C5C61',
          '--color-text-muted': '#737380',
          '--color-purple': '#FF6B35',
          '--color-green': '#22C55E',
          '--color-blue': '#3B82F6',
          '--color-red': '#EF4444',
          '--color-yellow': '#EAB308',
          '--color-border': 'rgba(0, 0, 0, 0.08)',
          '--color-border-strong': 'rgba(0, 0, 0, 0.15)',
        },
      },
    },
    {
      name: 'Ocean Depth',
      slug: 'ocean-depth',
      isDefault: false,
      order: 1,
      colors: {
        dark: {
          '--color-bg-primary': '#0A1628',
          '--color-bg-secondary': '#0E1D33',
          '--color-bg-card': '#122340',
          '--color-bg-elevated': '#1A2D4D',
          '--color-text-primary': '#E2E8F0',
          '--color-text-secondary': '#8B9DC3',
          '--color-text-muted': '#6B82A8',
          '--color-purple': '#06B6D4',
          '--color-green': '#34D399',
          '--color-blue': '#38BDF8',
          '--color-red': '#F87171',
          '--color-yellow': '#FBBF24',
          '--color-border': 'rgba(6, 182, 212, 0.10)',
          '--color-border-strong': 'rgba(6, 182, 212, 0.20)',
        },
        light: {
          '--color-bg-primary': '#F0F9FF',
          '--color-bg-secondary': '#E0F2FE',
          '--color-bg-card': '#FFFFFF',
          '--color-bg-elevated': '#D6EDFB',
          '--color-text-primary': '#0C1A2E',
          '--color-text-secondary': '#3B5578',
          '--color-text-muted': '#5A7899',
          '--color-purple': '#0891B2',
          '--color-green': '#059669',
          '--color-blue': '#0284C7',
          '--color-red': '#DC2626',
          '--color-yellow': '#D97706',
          '--color-border': 'rgba(0, 0, 0, 0.08)',
          '--color-border-strong': 'rgba(0, 0, 0, 0.15)',
        },
      },
    },
    {
      name: 'Forest',
      slug: 'forest',
      isDefault: false,
      order: 2,
      colors: {
        dark: {
          '--color-bg-primary': '#0A1410',
          '--color-bg-secondary': '#0E1C16',
          '--color-bg-card': '#12241C',
          '--color-bg-elevated': '#1A3028',
          '--color-text-primary': '#E2F0E8',
          '--color-text-secondary': '#8BAF9C',
          '--color-text-muted': '#6B9480',
          '--color-purple': '#10B981',
          '--color-green': '#34D399',
          '--color-blue': '#38BDF8',
          '--color-red': '#F87171',
          '--color-yellow': '#FBBF24',
          '--color-border': 'rgba(16, 185, 129, 0.10)',
          '--color-border-strong': 'rgba(16, 185, 129, 0.20)',
        },
        light: {
          '--color-bg-primary': '#F0FDF7',
          '--color-bg-secondary': '#DCFCE7',
          '--color-bg-card': '#FFFFFF',
          '--color-bg-elevated': '#D1FAE5',
          '--color-text-primary': '#0A1F14',
          '--color-text-secondary': '#3B6B52',
          '--color-text-muted': '#5A8A72',
          '--color-purple': '#059669',
          '--color-green': '#059669',
          '--color-blue': '#0284C7',
          '--color-red': '#DC2626',
          '--color-yellow': '#D97706',
          '--color-border': 'rgba(0, 0, 0, 0.08)',
          '--color-border-strong': 'rgba(0, 0, 0, 0.15)',
        },
      },
    },
    {
      name: 'Dracula',
      slug: 'dracula',
      isDefault: false,
      order: 3,
      colors: {
        dark: {
          '--color-bg-primary': '#282A36',
          '--color-bg-secondary': '#2D2F3D',
          '--color-bg-card': '#343746',
          '--color-bg-elevated': '#3C3F52',
          '--color-text-primary': '#F8F8F2',
          '--color-text-secondary': '#BFC0CC',
          '--color-text-muted': '#6272A4',
          '--color-purple': '#BD93F9',
          '--color-green': '#50FA7B',
          '--color-blue': '#8BE9FD',
          '--color-red': '#FF5555',
          '--color-yellow': '#F1FA8C',
          '--color-border': 'rgba(189, 147, 249, 0.10)',
          '--color-border-strong': 'rgba(189, 147, 249, 0.20)',
        },
        light: {
          '--color-bg-primary': '#F8F8F2',
          '--color-bg-secondary': '#EEEEE8',
          '--color-bg-card': '#FFFFFF',
          '--color-bg-elevated': '#E6E6E0',
          '--color-text-primary': '#282A36',
          '--color-text-secondary': '#575A6E',
          '--color-text-muted': '#6272A4',
          '--color-purple': '#9B6DD7',
          '--color-green': '#2ECC71',
          '--color-blue': '#45A5C4',
          '--color-red': '#E04040',
          '--color-yellow': '#C9A62C',
          '--color-border': 'rgba(0, 0, 0, 0.08)',
          '--color-border-strong': 'rgba(0, 0, 0, 0.15)',
        },
      },
    },
    {
      name: 'Solarized Dark',
      slug: 'solarized-dark',
      isDefault: false,
      order: 4,
      colors: {
        dark: {
          '--color-bg-primary': '#002B36',
          '--color-bg-secondary': '#073642',
          '--color-bg-card': '#0A3D49',
          '--color-bg-elevated': '#104450',
          '--color-text-primary': '#FDF6E3',
          '--color-text-secondary': '#93A1A1',
          '--color-text-muted': '#657B83',
          '--color-purple': '#B58900',
          '--color-green': '#859900',
          '--color-blue': '#268BD2',
          '--color-red': '#DC322F',
          '--color-yellow': '#B58900',
          '--color-border': 'rgba(181, 137, 0, 0.12)',
          '--color-border-strong': 'rgba(181, 137, 0, 0.22)',
        },
        light: {
          '--color-bg-primary': '#FDF6E3',
          '--color-bg-secondary': '#EEE8D5',
          '--color-bg-card': '#FFFFFF',
          '--color-bg-elevated': '#E8E1CC',
          '--color-text-primary': '#002B36',
          '--color-text-secondary': '#586E75',
          '--color-text-muted': '#839496',
          '--color-purple': '#B58900',
          '--color-green': '#859900',
          '--color-blue': '#268BD2',
          '--color-red': '#DC322F',
          '--color-yellow': '#B58900',
          '--color-border': 'rgba(0, 0, 0, 0.08)',
          '--color-border-strong': 'rgba(0, 0, 0, 0.15)',
        },
      },
    },
    {
      name: 'Rosé Pine',
      slug: 'rose-pine',
      isDefault: false,
      order: 5,
      colors: {
        dark: {
          '--color-bg-primary': '#191724',
          '--color-bg-secondary': '#1F1D2E',
          '--color-bg-card': '#26233A',
          '--color-bg-elevated': '#2A2740',
          '--color-text-primary': '#E0DEF4',
          '--color-text-secondary': '#908CAA',
          '--color-text-muted': '#6E6A86',
          '--color-purple': '#EB6F92',
          '--color-green': '#9CCFD8',
          '--color-blue': '#31748F',
          '--color-red': '#EB6F92',
          '--color-yellow': '#F6C177',
          '--color-border': 'rgba(235, 111, 146, 0.10)',
          '--color-border-strong': 'rgba(235, 111, 146, 0.20)',
        },
        light: {
          '--color-bg-primary': '#FAF4ED',
          '--color-bg-secondary': '#F2E9E1',
          '--color-bg-card': '#FFFAF3',
          '--color-bg-elevated': '#EBE1D7',
          '--color-text-primary': '#21202E',
          '--color-text-secondary': '#6E6A86',
          '--color-text-muted': '#908CAA',
          '--color-purple': '#D7627E',
          '--color-green': '#56949F',
          '--color-blue': '#286983',
          '--color-red': '#D7627E',
          '--color-yellow': '#EA9D34',
          '--color-border': 'rgba(0, 0, 0, 0.08)',
          '--color-border-strong': 'rgba(0, 0, 0, 0.15)',
        },
      },
    },
  ];

  for (const p of SEED_PALETTES) {
    await db.insert(palettes).values({
      name: p.name,
      slug: p.slug,
      colors: p.colors,
      isDefault: p.isDefault,
      isActive: true,
      order: p.order,
    }).onConflictDoNothing();
  }
  console.log(`Seeded ${SEED_PALETTES.length} palettes.`);

  console.log('Seed complete.');
  await client.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
