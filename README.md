# Terminal Trainer

An interactive web app that teaches non-technical people how to use the terminal — from absolute zero to working knowledge.

**Live:** https://itayshmool.github.io/from-dev-basics-to-claude-code/

## What It Does

Terminal Trainer takes beginners through a structured curriculum of 102 interactive lessons across 8 levels. Each lesson uses a mix of narrative explanations, quizzes, fill-in-the-blank exercises, click-to-match games, file tree exploration, path building, terminal previews with animated typing, and program step-through simulators.

## Curriculum

| Level | Title | Lessons |
|-------|-------|---------|
| 0 | Computers Are Not Magic | 6 |
| 1 | Your First 30 Minutes in the Terminal | 12 |
| 2 | Reading and Writing Files | 15 |
| 3 | Your Code Has a History | 15 |
| 4 | How Software Actually Works | 15 |
| 5 | Building With Real Tools | 15 |
| 6 | Claude Code — Your AI Pair Programmer | 12 |
| 7 | Junior Developer Patterns | 12 |

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
| Admin login | https://itayshmool.github.io/from-dev-basics-to-claude-code/admin/login |
| Admin dashboard | https://itayshmool.github.io/from-dev-basics-to-claude-code/admin |
| API health | https://terminal-trainer-api.onrender.com/api/health |

## Project Structure

```
src/
  App.tsx                          # React Router routes
  index.css                        # Theme tokens + animations
  contexts/
    AuthContext.tsx                 # Auth state provider
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
    admin/
      AdminLoginScreen.tsx         # Admin login (separate)
      AdminGuard.tsx               # Role-based route protection
      AdminLayout.tsx              # Admin sidebar + layout
      AdminDashboard.tsx           # Stats overview
      AdminStudentList.tsx         # Student management
      AdminLevelList.tsx           # Level management
      AdminLessonList.tsx          # Lesson management
      AdminLessonEditor.tsx        # Lesson JSON editor
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
  drizzle/                         # Migration SQL files

specs/
  APP_SPEC.md                      # Application specification
  BACKEND_SPEC.md                  # Backend specification
  DEPLOYMENT_SPEC.md               # Deployment architecture
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
- **Backend:** Push to `main` → Render auto-builds, runs migrations + seed, restarts

See `specs/DEPLOYMENT_SPEC.md` for full deployment architecture.
