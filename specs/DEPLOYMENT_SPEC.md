# Deployment Spec: Terminal Trainer

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Render Platform                        │
│                                                          │
│  ┌─────────────────────────┐  ┌───────────────────────┐  │
│  │  Static Site (Frontend)  │  │  Web Service (Backend) │  │
│  │  terminal-trainer-83vj   │  │  terminal-trainer-api  │  │
│  │  React SPA via CDN       │─▶│  Node.js/Express       │  │
│  │  srv-d6kak0kr85hc739icnug│  │  srv-d6jbmbp4tr6s739ccvcg│
│  └─────────────────────────┘  │                         │  │
│                                │  ┌───────────────────┐  │  │
│                                │  │  PostgreSQL        │  │  │
│                                │  │  dpg-d6jbi5fgi27c73│  │  │
│                                │  │  Drizzle ORM       │  │  │
│                                │  └───────────────────┘  │  │
│                                └───────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Live URLs

| Resource | URL |
|----------|-----|
| Frontend (home) | https://terminal-trainer-83vj.onrender.com |
| Student login | https://terminal-trainer-83vj.onrender.com/login |
| Student register | https://terminal-trainer-83vj.onrender.com/register |
| User dashboard | https://terminal-trainer-83vj.onrender.com/dashboard |
| Admin login | https://terminal-trainer-83vj.onrender.com/admin/login |
| Admin dashboard | https://terminal-trainer-83vj.onrender.com/admin |
| API health check | https://terminal-trainer-api.onrender.com/api/health |
| Render dashboard (frontend) | https://dashboard.render.com/static/srv-d6kak0kr85hc739icnug |
| Render dashboard (backend) | https://dashboard.render.com/web/srv-d6jbmbp4tr6s739ccvcg |
| Render dashboard (db) | https://dashboard.render.com/d/dpg-d6jbi5fgi27c73d2jiv0-a |

## Frontend — Render Static Site

### How It Deploys
Push to `main` → Render auto-builds → `npm install && npm run build` → serves `dist/` via CDN.

### Build-Time Environment Variables
Set on the Render static site (dashboard or MCP):

| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_USE_API` | `true` | Enables API data layer (vs static JSON fallback) |
| `VITE_API_URL` | `https://terminal-trainer-api.onrender.com` | Backend API base URL |
| `VITE_TURNSTILE_SITE_KEY` | `0x4AAAAAACmX1Q1qUgrX3eOY` | Cloudflare Turnstile CAPTCHA site key |

### Dual-Mode Data Layer
The frontend works with or without the backend:
- **API mode** (`VITE_USE_API=true`): Lessons fetched from API, progress synced to database, auth enabled
- **Static mode** (`VITE_USE_API=false`): Lessons loaded from bundled JSON, progress in localStorage, no auth

### SPA Routing
Render rewrite rule: `/* → /index.html` (configured in dashboard Redirects/Rewrites tab). This ensures all client-side routes are handled by React Router.

## Backend — Render Web Service

### Web Service
| Field | Value |
|-------|-------|
| Name | `terminal-trainer-api` |
| ID | `srv-d6jbmbp4tr6s739ccvcg` |
| Runtime | Node.js 22 |
| Region | Frankfurt |
| Plan | Starter |
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
| `CORS_ORIGIN` | `https://terminal-trainer-83vj.onrender.com,https://terminal-trainer-api.onrender.com` |
| `ADMIN_PASSWORD` | Used by seed script to create the admin user |
| `GITHUB_PAT` | GitHub Personal Access Token with `repo` scope (for bug report → GitHub Issues) |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key (server-side verification) |

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
4. Cookie settings: `httpOnly`, `secure`, `sameSite: 'none'` (cross-origin: different Render subdomains)

## Bug Reports → GitHub Issues
- Students submit bug reports via the frontend modal
- Backend creates GitHub Issues using `GITHUB_PAT` (server-side)
- Cloudflare Turnstile CAPTCHA protects against abuse
- Works with private repos (PAT has `repo` scope)

## Free Tier Considerations

### Render Limitations
- **Cold starts**: Web service sleeps after 15 minutes of inactivity. First request after sleep takes ~30 seconds.
- **Database expiry**: Free Postgres expires after 30 days. Must recreate or upgrade before expiry.
- **Build minutes**: Limited monthly build minutes on free plan.
- **Static site**: Free, CDN-backed, no cold start issues.

### CORS During Cold Start
When the Render web service is sleeping, the first request may receive a Render-generated error page without CORS headers. The browser will show a CORS error. Subsequent requests work normally once the server wakes up.

## Deploy Workflow

### Routine Deploys (code changes)
1. Push to `main`
2. Render auto-deploys frontend static site (builds, publishes to CDN)
3. Render auto-deploys backend (builds, runs migrations, seeds, restarts)

### Database Changes
1. Edit `server/src/db/schema.ts`
2. Run `cd server && DATABASE_URL=postgresql://dummy:x@localhost/x npm run db:generate` to generate migration SQL
3. Commit the new migration file in `server/drizzle/`
4. Push to `main` — Render build runs `npm run db:migrate` automatically

### Environment Variable Changes
- **Frontend**: Update in Render static site dashboard → redeploy
- **Backend**: Update in Render web service dashboard → auto-redeploys

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
      bugReports.ts       # POST /api/bug-reports (Turnstile + GitHub Issues)
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
