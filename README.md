# From Zero to Claude Code

An interactive web app that teaches non-technical people how to use the terminal — from absolute zero to working knowledge.

**Live:** https://zero2claude.dev
**API:** https://terminal-trainer-api.onrender.com

## What It Does

From Zero to Claude Code takes beginners through a structured curriculum of 102 interactive lessons across 8 levels. Each lesson uses a mix of narrative explanations, quizzes, fill-in-the-blank exercises, click-to-match games, file tree exploration, path building, terminal previews with animated typing, and program step-through simulators.

### For Students
- **102 interactive lessons** with 9 component types
- **Virtual terminal** with in-memory filesystem, command parser, and file explorer sidebar
- **AI-powered personalized learning plan** — describe your background, get a custom path through the curriculum with priority levels and recommended lessons
- **User dashboard** (`/dashboard`) — overview with smart continue, progress stats & streaks, 16 achievements, profile management, personalized plan view
- **Achievement system** — milestones, level mastery, streak badges, speed achievements with toast notifications
- **Smart continue** — picks up where you left off with pace tracking and estimated completion

### For Admins
- **Admin dashboard** (`/admin`) — student management, level/lesson CRUD, lesson editor with live preview
- **AI onboarding management** (`/admin/onboarding`) — toggle AI plan generation on/off, choose AI provider (Anthropic or Gemini), run provider API connectivity tests before enabling, and monitor usage split by provider
- **Theme editor** — runtime CSS variable overrides persisted via API, applied globally to all users
- **Content validator** — structural checks across all 102 lessons
- **Analytics** — completion funnels, drop-off analysis, weekly trends

## Curriculum

| Level | Title | Lessons | Type |
|-------|-------|---------|------|
| 0 | Computers Are Not Magic | 6 | Conceptual |
| 1 | Your First 30 Minutes in the Terminal | 12 | Terminal sandbox |
| 2 | Reading and Writing Files | 12 | Terminal sandbox |
| 3 | Your Code Has a History | 16 | Terminal sandbox |
| 4 | How Software Actually Works | 14 | Conceptual + interactive |
| 5 | Building With Real Tools | 15 | Guided hands-on |
| 6 | Claude Code — Your AI Pair Programmer | 15 | Guided hands-on |
| 7 | Junior Developer Patterns | 12 | Guided hands-on |

## Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **Styling:** Tailwind CSS v4 with CSS custom properties
- **Routing:** React Router 7
- **Hosting:** GitHub Pages (auto-deploy via GitHub Actions)

### Backend
- **Server:** Node.js + Express + TypeScript
- **Database:** PostgreSQL with Drizzle ORM
- **Auth:** JWT access/refresh tokens, bcrypt passwords
- **Hosting:** Render (web service + managed PostgreSQL, Frankfurt)

## Architecture

```
GitHub Pages (CDN)          Render (Frankfurt)
┌─────────────────┐        ┌──────────────────┐
│  React SPA      │──API──▶│  Express Server   │
│  Static assets  │        │  PostgreSQL       │
└─────────────────┘        └──────────────────┘
```

The frontend works in dual mode:
- **With backend:** Lessons from API, progress synced to database, user auth
- **Without backend:** Lessons from bundled JSON, progress in localStorage

## Design

Dark terminal-noir aesthetic:
- Void black background (`#09090B`), electric orange accent (`#FF6B35`)
- Monaco font identity for headings/code, system sans-serif for body
- Warm dark terminals (`#2D2B28`)
- Ambient glow effects, glassmorphism CTA bars

The UX follows an immersive lesson model:
- Full-screen lessons with no navigation chrome
- Bottom-fixed CTA buttons
- Thin progress bar with close button
- Slide transitions between sections
- Celebration overlay on correct answers

## URLs

| Page | URL |
|------|-----|
| Home | https://itayshmool.github.io/from-dev-basics-to-claude-code/ |
| Student login | https://itayshmool.github.io/from-dev-basics-to-claude-code/login |
| Student register | https://itayshmool.github.io/from-dev-basics-to-claude-code/register |
| User dashboard | https://itayshmool.github.io/from-dev-basics-to-claude-code/dashboard |
| Admin login | https://itayshmool.github.io/from-dev-basics-to-claude-code/admin/login |
| AI onboarding | https://itayshmool.github.io/from-dev-basics-to-claude-code/onboarding/ai |
| Admin dashboard | https://itayshmool.github.io/from-dev-basics-to-claude-code/admin |
| Admin AI onboarding | https://itayshmool.github.io/from-dev-basics-to-claude-code/admin/onboarding |
| API health | https://terminal-trainer-api.onrender.com/api/health |

## Project Structure

```
src/
  App.tsx                          # React Router routes
  index.css                        # Theme tokens + animations
  contexts/
    AuthContext.tsx                 # Auth state provider
    AchievementContext.tsx          # Achievement toast queue
  services/
    api.ts                         # API client with token refresh
    authService.ts                 # Login/register/refresh/logout
    dataService.ts                 # Dual-mode data loading
    progressService.ts             # Progress sync
  components/
    home/HomeScreen.tsx            # Lesson picker dashboard
    auth/
      LoginScreen.tsx              # Student login
      RegisterScreen.tsx           # Student registration
    dashboard/
      DashboardGuard.tsx           # Auth gate (redirect if not logged in)
      DashboardLayout.tsx          # Sidebar + layout
      DashboardOverview.tsx        # Smart continue, pace stats
      DashboardStats.tsx           # Progress stats, streaks, activity
      DashboardAchievements.tsx    # Trophy case (16 achievements)
      DashboardProfile.tsx         # View/edit profile
      DashboardSettings.tsx        # Change password
      DashboardPlan.tsx            # AI learning plan view (sorted by priority)
    onboarding/
      AIOnboarding.tsx             # AI-powered plan generation page
    admin/
      AdminLoginScreen.tsx         # Admin login (separate)
      AdminGuard.tsx               # Role-based route protection
      AdminLayout.tsx              # Admin sidebar + layout
      AdminDashboard.tsx           # Stats overview
      AdminStudentList.tsx         # Student management
      AdminLevelList.tsx           # Level management
      AdminLessonList.tsx          # Lesson management
      AdminLessonEditor.tsx        # Lesson JSON editor
      AdminThemeEditor.tsx         # Live theme editor with API persistence
      AdminContentValidator.tsx    # Lesson structure validator
      AdminAnalytics.tsx           # Engagement analytics
      AdminOnboardingStats.tsx     # AI onboarding: toggle, provider switch, connectivity tests, usage stats
    ui/
      AchievementToast.tsx         # Floating achievement notification
    lesson/
      LessonView.tsx               # Lesson orchestrator
      LessonStep.tsx               # Shared layout: content + fixed CTA
      SectionRenderer.tsx          # Routes sections to components
    interactive/                   # 9 interactive component types
  core/
    lesson/                        # Lesson engine + types
    terminal/                      # VFS, command parser, terminal context
  data/
    lessons/level{0-7}/            # 102 lesson JSON files

server/
  src/
    index.ts                       # Express entry point
    db/schema.ts                   # Drizzle table definitions
    db/migrate.ts                  # Migration runner
    db/seed.ts                     # Seeds DB from lesson JSONs
    routes/                        # API route handlers
    middleware/                    # Auth + error handling
    lib/
      achievements.ts              # Achievement registry (16 achievements)
      aiClient.ts                  # Shared AI provider client (Anthropic + Gemini)
      onboardingGenerator.ts       # AI plan generation via configured provider
      paletteGenerator.ts          # AI palette generation via configured provider
    routes/
      onboarding.ts                # AI onboarding API routes
  drizzle/                         # Migration SQL files

specs/
  APP_SPEC.md                      # Application specification
  BACKEND_SPEC.md                  # Backend specification
  DEPLOYMENT_SPEC.md               # Deployment architecture
  ADMIN_DASHBOARD_SPEC.md          # Admin dashboard expansion spec
  USER_DASHBOARD_SPEC.md           # User dashboard spec (4 phases)
  AI_PROVIDER_ADMIN_TEST_SPEC.md   # AI provider switch + admin preflight test spec
  LEVEL_0_SPEC.md - LEVEL_7_SPEC.md
```

## Development

```bash
# Frontend
npm install
npm run dev          # Start dev server (localhost:5173)
npm run build        # TypeScript check + production build

# Backend
cd server
npm install
npm run dev          # Start server with hot reload (localhost:3001)
npm run build        # Compile TypeScript
npm run db:generate  # Generate migration SQL from schema
npm run db:migrate   # Apply migrations
npm run db:seed      # Seed levels, lessons, admin user
```

## Deployment

- **Frontend:** Push to `main` → GitHub Actions builds and deploys to GitHub Pages
- **Backend:** Push to `main` → Render auto-builds, runs migrations, restarts
- **AI provider env vars:** backend supports `ANTHROPIC_API_KEY` and `GEMINI_API_KEY`; active provider is selected from admin settings

See `specs/DEPLOYMENT_SPEC.md` for full deployment architecture.
