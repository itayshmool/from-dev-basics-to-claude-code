# Deployment Spec: Terminal Trainer

## Architecture Overview

```
┌─────────────────────────────┐     ┌──────────────────────────────────┐
│   GitHub Pages (Frontend)   │     │       Render (Backend)           │
│                             │     │                                  │
│  Static React SPA           │────▶│  Web Service (Node.js/Express)   │
│  Vite build → dist/         │ API │  srv-d6jbmbp4tr6s739ccvcg        │
│  CDN-served globally        │     │                                  │
│                             │     │  ┌──────────────────────────┐    │
│                             │     │  │  PostgreSQL (managed)    │    │
│                             │     │  │  dpg-d6jbi5fgi27c73d2jiv0│    │
│                             │     │  │  Drizzle ORM             │    │
│                             │     │  └──────────────────────────┘    │
└─────────────────────────────┘     └──────────────────────────────────┘
```

## Live URLs

| Resource | URL |
|----------|-----|
| Frontend (home) | https://itayshmool.github.io/from-dev-basics-to-claude-code/ |
| Student login | https://itayshmool.github.io/from-dev-basics-to-claude-code/login |
| Student register | https://itayshmool.github.io/from-dev-basics-to-claude-code/register |
| User dashboard | https://itayshmool.github.io/from-dev-basics-to-claude-code/dashboard |
| Admin login | https://itayshmool.github.io/from-dev-basics-to-claude-code/admin/login |
| Admin dashboard | https://itayshmool.github.io/from-dev-basics-to-claude-code/admin |
| API health check | https://terminal-trainer-api.onrender.com/api/health |
| Render dashboard (web) | https://dashboard.render.com/web/srv-d6jbmbp4tr6s739ccvcg |
| Render dashboard (db) | https://dashboard.render.com/d/dpg-d6jbi5fgi27c73d2jiv0-a |

## Frontend — GitHub Pages

### How It Deploys
Push to `main` → GitHub Actions workflow (`.github/workflows/deploy.yml`) → `npm run build` → deploy `dist/` to GitHub Pages.

The workflow can also be triggered manually via `workflow_dispatch`.

### Build-Time Environment Variables
Set as GitHub repository variables (Settings → Variables → Actions):

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_USE_API` | `true` | Enables API data layer (vs static JSON fallback) |
| `VITE_API_URL` | `https://terminal-trainer-api.onrender.com` | Backend API base URL |

### Dual-Mode Data Layer
The frontend works with or without the backend:
- **API mode** (`VITE_USE_API=true`): Lessons fetched from API, progress synced to database, auth enabled
- **Static mode** (`VITE_USE_API=false`): Lessons loaded from bundled JSON, progress in localStorage, no auth

### SPA Routing
`dist/404.html` is a copy of `dist/index.html`, enabling client-side routing on GitHub Pages (which serves 404.html for unknown paths, letting React Router handle them).

## Backend — Render

### Web Service
| Field | Value |
|-------|-------|
| Name | `terminal-trainer-api` |
| ID | `srv-d6jbmbp4tr6s739ccvcg` |
| Runtime | Node.js 22 |
| Region | Frankfurt |
| Plan | Free |
| Auto-deploy | Yes (on push to `main`) |
| Build command | `cd server && npm install && npm run build && npm run db:migrate && npm run db:seed` |
| Start command | `cd server && npm run start` |

### PostgreSQL
| Field | Value |
|-------|-------|
| Name | `terminal-trainer-db` |
| ID | `dpg-d6jbi5fgi27c73d2jiv0-a` |
| Version | 16 |
| Region | Frankfurt |
| Plan | Free |

### Environment Variables (Web Service)
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Internal Postgres connection string (from Render dashboard) |
| `JWT_SECRET` | 64-char hex string for access token signing |
| `JWT_REFRESH_SECRET` | 64-char hex string for refresh token signing |
| `PORT` | `3001` |
| `CORS_ORIGIN` | `https://itayshmool.github.io,https://terminal-trainer-api.onrender.com` |
| `ADMIN_PASSWORD` | Used by seed script to create the admin user |

### Database Schema
5 tables managed by Drizzle ORM:
- **levels** — 8 levels with title, subtitle, emoji, publish status
- **lessons** — 102 lessons with sections (JSONB), filesystem specs, metadata
- **users** — username/password (bcrypt), role (`student` or `admin`)
- **progress** — per-user per-lesson section index, completion status
- **site_settings** — key-value store for admin-configurable settings (e.g., theme overrides)

Migration files committed in `server/drizzle/`. Migrations run automatically during each build.

### Seed Script
`npm run db:seed` reads lesson JSON files from `src/data/lessons/level{0-7}/` and inserts them into the database. Uses `onConflictDoNothing()` so it's idempotent — safe to run on every deploy.

### Auth Flow
1. Login/register → API returns access token (15min JWT) + refresh token (7-day httpOnly cookie)
2. Access token stored in memory (React state), sent as `Authorization: Bearer` header
3. On 401 → auto-refresh using cookie, retry request
4. Cookie settings: `httpOnly`, `secure`, `sameSite: 'none'` (cross-origin GitHub Pages → Render)

## Free Tier Considerations

### Render Free Tier Limitations
- **Cold starts**: Service sleeps after 15 minutes of inactivity. First request after sleep takes ~30 seconds.
- **Database expiry**: Free Postgres expires after 30 days. Must recreate or upgrade before expiry.
- **Build minutes**: Limited monthly build minutes on free plan.

### CORS During Cold Start
When the Render service is sleeping, the first request may receive a Render-generated error page without CORS headers. The browser will show a CORS error. Subsequent requests work normally once the server wakes up.

## Deploy Workflow

### Routine Deploys (code changes)
1. Push to `main`
2. GitHub Actions auto-deploys frontend to GitHub Pages
3. Render auto-deploys backend (builds, runs migrations, seeds, restarts)

### Database Changes
1. Edit `server/src/db/schema.ts`
2. Run `cd server && DATABASE_URL=postgresql://dummy:x@localhost/x npm run db:generate` to generate migration SQL
3. Commit the new migration file in `server/drizzle/`
4. Push to `main` — Render build runs `npm run db:migrate` automatically

### Environment Variable Changes
- **Frontend**: Update GitHub repository variables → trigger workflow manually or push
- **Backend**: Update in Render dashboard → auto-redeploys

## Server Directory Structure
```
server/
  src/
    index.ts              # Express app entry point
    db/
      schema.ts           # Drizzle table definitions
      migrate.ts          # Migration runner
      seed.ts             # Seeds levels + lessons + admin user
      index.ts            # DB connection singleton
    routes/
      levels.ts           # GET /api/levels, GET /api/lessons/:id
      auth.ts             # POST /api/auth/{login,register,refresh,logout}, GET /me, PUT /profile, PUT /password
      progress.ts         # GET/PUT /api/progress, GET /stats, GET /achievements, GET /continue
      admin.ts            # Admin CRUD endpoints + site settings
    middleware/
      auth.ts             # JWT verification middleware
      errorHandler.ts     # Global error handler
    lib/
      env.ts              # Zod-validated environment config
      password.ts         # bcrypt helpers
      achievements.ts     # Achievement registry (16 achievements)
  drizzle/                # Migration SQL files (committed)
  drizzle.config.ts       # Drizzle Kit config
  tsconfig.json
  package.json
```
