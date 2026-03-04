# From Zero to Claude Code — Project Context

## What This Is
An interactive web app teaching non-technical people how to use the terminal. 102 lessons across 8 levels.

**Frontend:** React 18 + TypeScript + Vite + Tailwind CSS v4 → Render Static Site
**Backend:** Node.js + Express + TypeScript + PostgreSQL + Drizzle ORM → Render

**Live:** https://zero2claude.dev
**API:** https://terminal-trainer-api.onrender.com

## Current State

### Implemented
- **All 8 levels** (0–7): 102 lessons fully built and playable
- **9 interactive components**: NarrativeBlock, Quiz, FillInBlank, ClickMatch, InteractiveFileTree, PathBuilder, TerminalPreview, ProgramSimulator, TerminalStep
- **Terminal infrastructure**: Virtual filesystem (VFS), command parser, Terminal UI, FileExplorer sidebar, CommandReferenceBar
- **Backend**: Express API, PostgreSQL, JWT auth, progress tracking, admin CRUD
- **Auth**: Student login/register, dedicated admin login at `/admin/login`
- **Admin dashboard**: Stats, student list, level/lesson management, lesson editor, theme editor, content validator, analytics
- **User dashboard** (`/dashboard`): Overview with smart continue, progress stats & streaks, 16 achievements with toast notifications, profile management, password change
- **Achievement system**: 16 achievements (milestones, level mastery, streaks, speed) computed server-side, toast notifications on unlock
- **Theme system**: Admin theme editor with runtime CSS variable overrides persisted via `site_settings` table, applied globally on page load
- **Dual-mode frontend**: Works with API (progress synced to DB) or without (localStorage fallback)
- **Deployment**: Render (frontend static site + backend web service + PostgreSQL), auto-deploy on push to `main`
- **Theme**: Dark terminal-noir aesthetic — void black palette (#09090B), electric orange accent (#FF6B35), Monaco font identity

### Not Yet Implemented
- Real terminal/sandbox (xterm.js, WebContainers) — Level 1 uses in-memory VFS
- Analytics, i18n

## Architecture
- `App.tsx` — React Router: `/` home, `/lesson/:id`, `/login`, `/register`, `/dashboard/*`, `/admin/login`, `/admin/*`
- `DashboardGuard.tsx` — redirects to `/login` if not authenticated (any role)
- `AdminGuard.tsx` — redirects to `/admin/login` if not authenticated as admin
- `AuthContext.tsx` — manages user state, token refresh, login/register/logout
- `AchievementContext.tsx` — manages achievement toast queue, provides `checkForNewAchievements()`
- `dataService.ts` — dual-mode: fetches from API or static JSON based on `VITE_USE_API`
- `LessonView.tsx` — orchestrates lesson flow, triggers achievement check on lesson completion
- `SectionRenderer.tsx` — routes section types to interactive components
- Theme defined in `src/index.css` via CSS custom properties in `@theme` block, overridable at runtime via admin theme editor

## Key Files
- `src/index.css` — all theme tokens, animations, and `.lesson-surface` override
- `src/contexts/AuthContext.tsx` — auth state provider
- `src/contexts/AchievementContext.tsx` — achievement toast queue
- `src/services/api.ts` — API client with auto token refresh
- `src/utils/theme.ts` — runtime theme application (fetches from API, applies CSS vars)
- `src/data/lessons/level{0-7}/` — 102 lesson JSON files
- `src/core/lesson/types.ts` — section type definitions
- `src/core/terminal/` — TerminalContext, CommandParser
- `src/components/dashboard/` — user dashboard (Overview, Stats, Achievements, Profile, Settings)
- `server/src/index.ts` — Express entry point
- `server/src/db/schema.ts` — Drizzle table definitions (levels, lessons, users, progress, site_settings)
- `server/src/db/seed.ts` — seeds DB from lesson JSONs
- `server/src/lib/achievements.ts` — achievement registry (16 achievements)
- `server/src/routes/progress.ts` — progress, stats, achievements, smart continue endpoints
- `server/drizzle/` — committed migration SQL files
- `specs/DEPLOYMENT_SPEC.md` — full deployment architecture
- `specs/USER_DASHBOARD_SPEC.md` — user dashboard spec (complete)

## Dev Commands
```bash
npm run dev       # Start frontend dev server
npm run build     # TypeScript check + production build

cd server
npm run dev       # Start backend with hot reload
npm run build     # Compile TypeScript
npm run db:migrate  # Apply migrations
npm run db:seed     # Seed database
```

## Deployment
- **Frontend:** Push to `main` → Render auto-builds static site, serves via CDN
- **Backend:** Push to `main` → Render auto-builds, migrates, seeds, restarts
- Frontend env vars set on Render static site: `VITE_USE_API=true`, `VITE_API_URL`, `VITE_TURNSTILE_SITE_KEY`
- SPA routing: Render rewrite rule `/* → /index.html`
- See `specs/DEPLOYMENT_SPEC.md` for full details

## Important Notes
- The `--color-purple` CSS variable is actually electric orange (#FF6B35), not purple. This naming was kept from the original theme to avoid renaming every class reference. All `bg-purple`, `text-purple` etc. render as orange.
- Terminal/code blocks use hardcoded warm dark colors (#2D2B28 background, #38352F titlebar, #F0ECE4 text, #6ABF69 prompt green, #D4A843 highlight gold) — not theme tokens.
- The app uses a dark theme throughout. The `--font-mono` (Monaco) is used as the identity font for headings, labels, and code. `--font-sans` (system SF Pro) is used for body text.
- Render free tier: service sleeps after 15min inactivity, ~30s cold start. Free Postgres expires after 30 days.
- Auth cookies use `sameSite: 'none'` for cross-origin (Render static site → Render API, different subdomains).
- Repo is private. Bug reports create GitHub Issues via server-side `GITHUB_PAT` (unaffected by repo visibility).
