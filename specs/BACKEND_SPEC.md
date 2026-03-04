# Backend Spec: Terminal Trainer Server

## Overview

| Field | Value |
|-------|-------|
| Stack | Node.js + Express + TypeScript |
| Database | PostgreSQL (managed on Render) |
| ORM | Drizzle ORM + Drizzle Kit migrations |
| Auth | Username/password, JWT (access + refresh tokens) |
| Hosting | Render (web service + managed PostgreSQL) |
| Frontend hosting | GitHub Pages (unchanged) |
| Admin | `/admin` route inside the existing React SPA |

## Current State (Implemented)

- **102 lessons** across 8 levels (0–7), stored as JSON files in `src/data/lessons/` and seeded into PostgreSQL
- **15 section types**: narrative, quiz, fillInBlank, match, interactiveTree, pathBuilder, terminalPreview, programSim, terminalStep, codeExample, dragSort, stepThrough, guideStep, promptTemplate, checklist
- **3 lesson types**: `conceptual` (Level 0, 4), `terminal` (Level 1–3), `guide` (Level 5–7)
- **User accounts** — students register with username/password, progress persists across devices
- **Server-side progress tracking** — per-student lesson completion stored in PostgreSQL
- **Admin dashboard** — student management, level/lesson CRUD, theme editor, content validator, analytics
- **User dashboard** — overview with smart continue, progress stats & streaks, 16 achievements, profile management
- **Achievement system** — 16 achievements computed server-side from progress data (no separate table)
- **Theme system** — admin-configurable runtime CSS overrides persisted in `site_settings` table
- **API-served content** — lessons loaded from database instead of static JSON imports
- **Dual-mode frontend** — works with or without backend (static fallback for GitHub Pages)
- **Deployed** — GitHub Pages (frontend) + Render (backend + PostgreSQL), auto-deploy on push to `main`

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    GitHub Pages                           │
│              (itayshmool.github.io)                       │
│                                                          │
│   React SPA (Vite + Tailwind)                            │
│   ┌──────────┐  ┌──────────┐  ┌───────────┐            │
│   │HomeScreen│  │LessonView│  │  /admin/*  │            │
│   └────┬─────┘  └────┬─────┘  └─────┬─────┘            │
│        │              │              │                    │
│        └──────────────┴──────────────┘                   │
│                       │                                  │
│              VITE_USE_API=true?                           │
│              ┌────────┴────────┐                         │
│              │ Yes             │ No                       │
│              │ fetch()         │ static imports           │
│              ▼                 ▼                          │
└──────────────┬─────────────────────────────────────────── │
               │ HTTPS (CORS)
               ▼
┌──────────────────────────────────────────────────────────┐
│                      Render                               │
│                                                          │
│   Express API Server (Node.js + TypeScript)              │
│   ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐│
│   │ /api/   │  │ /api/   │  │ /api/    │  │ /api/    ││
│   │ levels  │  │ auth    │  │ progress │  │ admin    ││
│   └────┬────┘  └────┬────┘  └────┬─────┘  └────┬─────┘│
│        └─────────────┴───────────┴──────────────┘       │
│                          │                               │
│                    Drizzle ORM                            │
│                          │                               │
│                 ┌────────▼────────┐                      │
│                 │   PostgreSQL    │                      │
│                 │  (Render mgd)  │                      │
│                 └─────────────────┘                      │
└──────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Separate deployments** — frontend on GitHub Pages, backend on Render. Connected via CORS.
2. **Dual-mode frontend** — `VITE_USE_API` env var controls whether data loads from static JSON (GitHub Pages standalone) or API (full backend). This means the current GitHub Pages deployment continues to work without a backend.
3. **localStorage stays** — ProgressTracker continues to use localStorage as the fast, synchronous store. API sync is layered on top: pull server→local on login, push local→server on completion.
4. **Admin inside the SPA** — `/admin` route in the same React app, protected by role check. No separate admin app.
5. **Username auth, not email** — simpler for a learning app. No email verification needed.

---

## Project Structure

```
/                                    # Repository root
├── src/                             # Frontend (existing)
│   ├── App.tsx                      # Add react-router-dom routes
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx      # NEW — username + password form
│   │   │   └── RegisterScreen.tsx   # NEW — registration form
│   │   ├── admin/
│   │   │   ├── AdminLayout.tsx      # NEW — sidebar + content area
│   │   │   ├── AdminGuard.tsx       # NEW — redirect if not admin
│   │   │   ├── AdminDashboard.tsx   # NEW — stats overview
│   │   │   ├── AdminStudentList.tsx # NEW — user table with progress
│   │   │   ├── AdminLevelList.tsx   # NEW — level management
│   │   │   ├── AdminLessonList.tsx  # NEW — lesson table
│   │   │   └── AdminLessonEditor.tsx# NEW — lesson edit form
│   │   ├── home/
│   │   ├── lesson/
│   │   └── interactive/
│   ├── contexts/
│   │   └── AuthContext.tsx          # NEW — auth state provider
│   ├── services/
│   │   ├── api.ts                   # NEW — fetch wrapper with auth headers
│   │   ├── dataService.ts          # NEW — dual-mode data loading
│   │   ├── authService.ts          # NEW — login/register/logout/refresh
│   │   └── progressSync.ts         # NEW — API sync on top of ProgressTracker
│   ├── hooks/
│   │   ├── useLevels.ts            # NEW — async level loading
│   │   ├── useLesson.ts            # NEW — async lesson loading
│   │   └── useProgress.ts          # MODIFY — add API sync calls
│   ├── core/
│   │   └── progress/
│   │       └── ProgressTracker.ts   # UNCHANGED — stays as localStorage
│   └── data/
│       ├── levels.ts                # MODIFY — add async API fetchers
│       └── lessons/                 # KEEP — static fallback
│
├── server/                          # NEW — backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── drizzle.config.ts
│   ├── .env.example
│   └── src/
│       ├── index.ts                 # Express app entry point
│       ├── db/
│       │   ├── index.ts             # Database connection (Drizzle client)
│       │   ├── schema.ts            # Table definitions
│       │   ├── migrate.ts           # Migration runner
│       │   └── seed.ts              # Import 102 JSON lessons into DB
│       ├── routes/
│       │   ├── levels.ts            # Public: GET /api/levels, GET /api/lessons/:id
│       │   ├── auth.ts              # POST register, login, refresh, logout
│       │   ├── progress.ts          # GET /api/progress, PUT /api/progress/:lessonId
│       │   └── admin.ts             # Admin CRUD for everything
│       ├── middleware/
│       │   ├── auth.ts              # JWT verification + requireAdmin
│       │   └── errorHandler.ts      # Global error handler
│       └── lib/
│           ├── jwt.ts               # Token sign/verify
│           ├── password.ts          # bcrypt hash/compare
│           └── env.ts               # Zod env validation
│
├── specs/
├── package.json                     # Frontend package.json (add react-router-dom)
└── .github/workflows/deploy.yml     # MODIFY — add VITE_USE_API, VITE_API_URL
```

---

## Database Schema

### `levels`

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PRIMARY KEY | Matches frontend level IDs (0, 1, 2, ..., 7) |
| title | VARCHAR(200) NOT NULL | |
| subtitle | VARCHAR(500) NOT NULL | |
| order | INTEGER NOT NULL | Display order |
| emoji | VARCHAR(10) NOT NULL | Level icon emoji |
| is_published | BOOLEAN DEFAULT true | Hide unpublished levels from students |
| created_at | TIMESTAMPTZ DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ DEFAULT NOW() | |

### `lessons`

| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(10) PRIMARY KEY | "0.1", "1.12", "7.12", etc. |
| level_id | INTEGER NOT NULL REFERENCES levels(id) | |
| title | VARCHAR(200) NOT NULL | |
| subtitle | VARCHAR(500) NOT NULL | |
| type | VARCHAR(20) NOT NULL | "conceptual", "terminal", or "guide" |
| order | INTEGER NOT NULL | Order within level |
| initial_fs | JSONB | FileSystemSpec for terminal lessons (nullable) |
| initial_dir | VARCHAR(500) | Starting directory (nullable) |
| commands_introduced | JSONB | String array (nullable) |
| sections | JSONB NOT NULL | Array of section objects — the lesson content |
| completion_message | TEXT | Nullable |
| milestone | JSONB | MilestoneInfo object (nullable) |
| next_lesson | VARCHAR(10) | Next lesson ID (nullable for last lesson) |
| is_published | BOOLEAN DEFAULT true | |
| created_at | TIMESTAMPTZ DEFAULT NOW() | |
| updated_at | TIMESTAMPTZ DEFAULT NOW() | |

### `users`

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PRIMARY KEY | gen_random_uuid() |
| username | VARCHAR(100) UNIQUE NOT NULL | Login identifier |
| password_hash | VARCHAR(255) NOT NULL | bcrypt, cost factor 12 |
| display_name | VARCHAR(100) NOT NULL | Shown in UI |
| role | VARCHAR(20) NOT NULL DEFAULT 'student' | "student" or "admin" |
| created_at | TIMESTAMPTZ DEFAULT NOW() | |

### `progress`

| Column | Type | Notes |
|--------|------|-------|
| id | SERIAL PRIMARY KEY | |
| user_id | UUID NOT NULL REFERENCES users(id) | |
| lesson_id | VARCHAR(10) NOT NULL REFERENCES lessons(id) | |
| section_index | INTEGER NOT NULL DEFAULT 0 | Last completed section index |
| completed | BOOLEAN NOT NULL DEFAULT false | |
| completed_at | TIMESTAMPTZ | Set when completed = true |
| UNIQUE(user_id, lesson_id) | | One row per user per lesson |

---

## API Endpoints

### Public (no auth required)

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/levels` | — | `LevelWithLessons[]` (lessons without sections) |
| GET | `/api/lessons/:id` | — | Full `Lesson` with sections |

**GET /api/levels response shape:**
```json
[
  {
    "id": 0,
    "title": "Computers Are Not Magic",
    "subtitle": "Files, folders, paths...",
    "emoji": "💻",
    "order": 0,
    "lessons": [
      { "id": "0.1", "title": "What Is a File?", "subtitle": "...", "type": "conceptual", "order": 1 },
      { "id": "0.2", "title": "...", "subtitle": "...", "type": "conceptual", "order": 2 }
    ]
  }
]
```

**GET /api/lessons/:id response:** Full lesson JSON matching the existing `Lesson` TypeScript interface (id, level, order, title, subtitle, type, sections, initialFs, initialDir, commandsIntroduced, completionMessage, milestone, nextLesson).

### Auth

| Method | Path | Request Body | Response |
|--------|------|-------------|----------|
| POST | `/api/auth/register` | `{ username, password, displayName }` | `{ user, accessToken }` + sets refresh cookie |
| POST | `/api/auth/login` | `{ username, password }` | `{ user, accessToken }` + sets refresh cookie |
| POST | `/api/auth/refresh` | — (reads httpOnly cookie) | `{ accessToken }` + rotates refresh cookie |
| POST | `/api/auth/logout` | — | Clears refresh cookie |

**Validation rules:**
- Username: 3–100 characters, alphanumeric + underscores, unique
- Password: 8+ characters
- Display name: 1–100 characters

**Error responses:**
- `400` — validation error (missing fields, password too short)
- `401` — invalid credentials
- `409` — username already taken

### User Profile (auth required)

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/auth/me` | — | Full profile with `createdAt` |
| PUT | `/api/auth/profile` | `{ displayName }` | Updated user object |
| PUT | `/api/auth/password` | `{ currentPassword, newPassword }` | `{ ok: true }` or 401 |

### Student Progress (auth required)

| Method | Path | Request | Response |
|--------|------|---------|----------|
| GET | `/api/progress` | — | `ProgressEntry[]` for current user |
| PUT | `/api/progress/:lessonId` | `{ sectionIndex, completed }` | Updated `ProgressEntry` |
| GET | `/api/progress/stats` | — | Aggregated stats, streaks, level breakdown, activity |
| GET | `/api/progress/achievements` | — | Computed earned + available badges (16 total) |
| GET | `/api/progress/continue` | — | Smart continue: in-progress lesson, next recommendation, pace, ETA |

**GET /api/progress response:**
```json
[
  { "lessonId": "0.1", "sectionIndex": 4, "completed": true, "completedAt": "2026-03-02T..." },
  { "lessonId": "0.2", "sectionIndex": 2, "completed": false, "completedAt": null }
]
```

**PUT /api/progress/:lessonId** — upserts: creates the row if it doesn't exist, updates if it does.

### Admin (auth + admin role required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats` | Aggregate stats: total users, total completions, completions per level, active users (7d) |
| GET | `/api/admin/users` | User list with `{ id, username, displayName, role, createdAt, lessonsCompleted }` |
| GET | `/api/admin/users/:id/progress` | Detailed progress for one student |
| GET | `/api/admin/levels` | All levels including unpublished |
| POST | `/api/admin/levels` | Create level |
| PUT | `/api/admin/levels/:id` | Update level (title, subtitle, emoji, isPublished) |
| DELETE | `/api/admin/levels/:id` | Delete level (fails if lessons exist) |
| GET | `/api/admin/lessons` | All lessons, filterable by `?levelId=0` |
| POST | `/api/admin/lessons` | Create lesson |
| PUT | `/api/admin/lessons/:id` | Update lesson (full replace) |
| DELETE | `/api/admin/lessons/:id` | Delete lesson |
| POST | `/api/admin/lessons/:id/duplicate` | Clone lesson with new ID |
| PUT | `/api/admin/lessons/reorder` | Bulk update order fields: `{ lessonIds: ["0.1", "0.2", ...] }` |

**GET /api/admin/stats response:**
```json
{
  "totalUsers": 47,
  "totalCompletions": 312,
  "activeUsersLast7Days": 12,
  "completionsPerLevel": [
    { "levelId": 0, "levelTitle": "Computers Are Not Magic", "completions": 89, "totalPossible": 282 },
    { "levelId": 1, "levelTitle": "Your First 30 Minutes...", "completions": 64, "totalPossible": 564 }
  ]
}
```

---

## Authentication Strategy

### Token Flow

```
1. User submits username + password
2. Server verifies credentials
3. Server returns:
   - Access token (in JSON response body) — 15 min expiry
   - Refresh token (in httpOnly cookie) — 7 day expiry
4. Client stores access token in memory (React state — NOT localStorage)
5. Client sends access token as: Authorization: Bearer <token>
6. When access token expires (401 response):
   - Client calls POST /api/auth/refresh
   - Server reads refresh cookie, verifies, issues new access + refresh tokens
   - Client retries the original request
7. On logout: server clears the refresh cookie
```

### Why Not localStorage for Tokens

Storing JWTs in localStorage exposes them to XSS attacks. Any injected script can read `localStorage.getItem('token')` and exfiltrate it. Memory (React state) is not accessible to injected scripts. The httpOnly refresh cookie is not readable by JavaScript at all.

### Cross-Origin Cookie Configuration

Since frontend (github.io) and backend (onrender.com) are different domains:

```typescript
// Server cookie settings
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: true,          // HTTPS only
  sameSite: 'none',      // Required for cross-origin
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth',     // Only sent to auth endpoints
});
```

### Admin Account

The seed script creates the initial admin account using the `ADMIN_PASSWORD` environment variable. Subsequent admin accounts can be promoted by existing admins (future feature — not in v1).

### Guest Mode

When the user is not logged in, all public endpoints still work. Lessons are viewable. Progress is stored in localStorage only (existing behavior). Logging in merges localStorage progress into the server.

---

## Frontend Changes

### New Dependency

```bash
npm install react-router-dom
```

### Routing (App.tsx)

The current `App.tsx` toggles between `HomeScreen` and `LessonView` via boolean state. This changes to `react-router-dom`:

```
/                    → HomeScreen
/lesson/:lessonId    → LessonView
/login               → LoginScreen
/register            → RegisterScreen
/admin               → AdminDashboard (guarded)
/admin/students      → AdminStudentList (guarded)
/admin/levels        → AdminLevelList (guarded)
/admin/lessons       → AdminLessonList (guarded)
/admin/lessons/:id   → AdminLessonEditor (guarded)
```

`basename` must be `/from-dev-basics-to-claude-code/` for GitHub Pages compatibility.

### Data Service (Dual-Mode)

```typescript
// src/services/dataService.ts
const USE_API = import.meta.env.VITE_USE_API === 'true';
const API_URL = import.meta.env.VITE_API_URL || '';

export async function fetchLevels(): Promise<LevelMeta[]> {
  if (!USE_API) {
    // Dynamic import — tree-shaken when USE_API=true
    const { levels } = await import('../data/levels');
    return levels;
  }
  const res = await fetch(`${API_URL}/api/levels`);
  return res.json();
}

export async function fetchLesson(id: string): Promise<Lesson | null> {
  if (!USE_API) {
    const { getLessonById } = await import('../data/levels');
    return getLessonById(id);
  }
  const res = await fetch(`${API_URL}/api/lessons/${id}`);
  if (!res.ok) return null;
  return res.json();
}
```

When `VITE_USE_API=true`, the 102 static JSON imports are code-split into a separate chunk that is never loaded. This keeps the API-mode bundle small.

### Auth Context

```typescript
// src/contexts/AuthContext.tsx
interface AuthContextValue {
  user: User | null;       // { id, username, displayName, role }
  isLoading: boolean;      // true during initial refresh check
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

On app mount, the provider calls `POST /api/auth/refresh` to check for an existing session. If a valid refresh cookie exists, the user is silently logged in.

### Progress Sync

The existing `ProgressTracker` (localStorage) stays unchanged. A new `progressSync.ts` service wraps it:

- **On login:** `GET /api/progress` → merge server data into localStorage (server wins on conflicts) → trigger React re-render
- **On `markLessonComplete()`:** write to localStorage immediately (optimistic), then fire-and-forget `PUT /api/progress/:lessonId`
- **On API failure:** localStorage already has the data. No user-facing error. Retry on next app load.
- **On logout:** keep localStorage data (it's the student's device), clear API token

### Login & Register Screens

Styled to match the existing dark terminal-noir theme. Minimal forms:

**Login:** username field, password field, submit button, link to register
**Register:** username field, display name field, password field, confirm password field, submit button, link to login

Both redirect to `/` (HomeScreen) on success.

### HomeScreen Changes

- Use `useLevels()` async hook instead of static import
- Add loading skeleton while levels load
- Add user menu in header: logged-in username + logout button, or login/register links for guests
- Progress bars work the same (fed by the merged localStorage + server data)

### LessonView Changes

- Use `useLesson(lessonId)` async hook instead of `getLessonById()`
- Add loading spinner while lesson loads
- Everything else unchanged — SectionRenderer, TerminalProvider, LessonEngine all receive the same `Lesson` object

---

## Admin Dashboard

### AdminLayout

Sidebar navigation:
- **Dashboard** — stats overview
- **Students** — user list
- **Levels** — level management
- **Lessons** — lesson management

Dark theme, consistent with the rest of the app. Uses existing CSS tokens.

### AdminDashboard

Stats cards (4 across on desktop, stacked on mobile):
- Total registered students
- Total lessons completed (across all students)
- Active students (last 7 days)
- Average completion rate

Per-level completion chart: horizontal bars showing % completion for each level. CSS-only (no charting library).

### AdminStudentList

Sortable table with columns:
- Username
- Display Name
- Joined (date)
- Lessons Completed (count / 102)
- Last Active

Click a row → expand to see per-level progress breakdown.

### AdminLevelList

Table with columns:
- Order | Emoji | Title | Subtitle | Lessons (count) | Published | Actions

Actions: Edit (inline modal), toggle Published, Delete (confirmation dialog, fails if level has lessons).

### AdminLessonList

Filterable by level (dropdown). Table with columns:
- ID | Title | Type | Sections (count) | Published | Actions

Actions: Edit, Duplicate, Delete, toggle Published.

### AdminLessonEditor

Form with fields:
- ID (read-only for existing, editable for new)
- Title, Subtitle
- Type dropdown (conceptual / terminal / guide)
- Completion message (textarea)
- Next lesson ID
- Sections: JSON editor (monospace textarea — upgrade to Monaco editor later if needed)
- For terminal lessons: initialFs (JSON editor), initialDir (text), commandsIntroduced (comma-separated)
- Milestone: JSON editor or structured form

Preview button: renders the lesson using the existing `SectionRenderer` in a modal overlay.

Save button: `PUT /api/admin/lessons/:id` (or `POST /api/admin/lessons` for new).

---

## Seed Script

The seed script (`server/src/db/seed.ts`) imports the existing 102 lesson JSON files into PostgreSQL:

1. **Read level metadata** — hardcoded array matching `src/lib/constants.ts`:
   ```
   Level 0: "Computers Are Not Magic" (6 lessons) 💻
   Level 1: "Your First 30 Minutes in the Terminal" (12 lessons) 📟
   Level 2: "Reading and Writing Files" (12 lessons) 📖
   Level 3: "Your Code Has a History" (16 lessons) 🔀
   Level 4: "How Software Actually Works" (14 lessons) ☁️
   Level 5: "Building With Real Tools" (15 lessons) 🔨
   Level 6: "Claude Code — Your AI Pair Programmer" (15 lessons) 🤖
   Level 7: "Junior Developer Patterns" (12 lessons) 🚀
   ```

2. **Insert levels** into the `levels` table

3. **Read all JSON files** from `../src/data/lessons/level*/lesson-*.json` using `fs.readFileSync` + `JSON.parse`

4. **Insert lessons** into the `lessons` table, mapping camelCase → snake_case:
   - `initialFs` → `initial_fs`
   - `initialDir` → `initial_dir`
   - `commandsIntroduced` → `commands_introduced`
   - `completionMessage` → `completion_message`
   - `nextLesson` → `next_lesson`

5. **Create admin user** from `ADMIN_PASSWORD` env var:
   ```
   username: admin
   displayName: Administrator
   role: admin
   password: (hashed from ADMIN_PASSWORD)
   ```

6. **Verify** — log counts: "Seeded 8 levels, 102 lessons, 1 admin user"

---

## Environment Variables

### Server (`server/.env`)

```env
DATABASE_URL=postgresql://user:pass@host:5432/terminal_trainer
JWT_SECRET=<random-64-character-string>
JWT_REFRESH_SECRET=<different-random-64-character-string>
PORT=3001
CORS_ORIGIN=http://localhost:5173,https://itayshmool.github.io
ADMIN_PASSWORD=<initial-admin-password>
```

### Frontend (`.env` or GitHub Actions vars)

```env
VITE_API_URL=http://localhost:3001
VITE_USE_API=true
```

For GitHub Pages deployment, set these as GitHub repository variables:
- `VITE_USE_API=true`
- `VITE_API_URL=https://<app-name>.onrender.com`

---

## Deployment

### Backend (Render Web Service)

1. Create a **Web Service** on Render, connected to the GitHub repo
2. **Root directory:** `server`
3. **Build command:** `npm install && npm run build`
4. **Start command:** `npm run start`
5. Add all environment variables (DATABASE_URL, JWT_SECRET, etc.)

### Database (Render Managed PostgreSQL)

1. Create a PostgreSQL instance on Render
2. Copy the internal connection string to `DATABASE_URL`
3. Run migrations via Render shell: `cd server && npm run db:migrate`
4. Run seed via Render shell: `cd server && npm run db:seed`

### Frontend (GitHub Pages — updated)

Update `.github/workflows/deploy.yml`:

```yaml
- run: npm run build
  env:
    VITE_USE_API: ${{ vars.VITE_USE_API || 'false' }}
    VITE_API_URL: ${{ vars.VITE_API_URL || '' }}
```

Set `VITE_USE_API` and `VITE_API_URL` as GitHub repository variables (Settings → Secrets and Variables → Variables).

### CORS

The backend allows:
- `https://itayshmool.github.io` (production)
- `http://localhost:5173` (development)

Both with `credentials: true` for the httpOnly refresh token cookie.

---

## Server Dependencies

```json
{
  "dependencies": {
    "express": "^4",
    "cors": "^2",
    "cookie-parser": "^1",
    "drizzle-orm": "^0.35",
    "postgres": "^3",
    "bcryptjs": "^2",
    "jsonwebtoken": "^9",
    "zod": "^3",
    "dotenv": "^16"
  },
  "devDependencies": {
    "typescript": "^5",
    "tsx": "^4",
    "drizzle-kit": "^0.30",
    "@types/express": "^4",
    "@types/cors": "^2",
    "@types/cookie-parser": "^1",
    "@types/bcryptjs": "^2",
    "@types/jsonwebtoken": "^9",
    "@types/node": "^22"
  }
}
```

**Dev scripts:**
- `dev` — `tsx watch src/index.ts`
- `build` — `tsc`
- `start` — `node dist/index.js`
- `db:generate` — `drizzle-kit generate`
- `db:migrate` — `tsx src/db/migrate.ts`
- `db:seed` — `tsx src/db/seed.ts`

---

## Implementation Phases

| Phase | What | Deliverable |
|-------|------|-------------|
| **1** | Server scaffolding + Drizzle schema + seed script | PostgreSQL with 8 levels and 102 lessons |
| **2** | Express routes: public API + auth + progress | Working API testable with curl |
| **3** | Frontend: react-router-dom + data service + auth screens + progress sync | App works in both static and API mode |
| **4** | Admin dashboard: stats, student list, level/lesson CRUD | `/admin` with full management UI |
| **5** | Deploy to Render + update GitHub Actions | Live backend, frontend pointing to it |

Each phase produces a working, testable increment. Phases 1–2 are backend-only (no frontend changes). Phase 3 modifies the frontend but keeps the static fallback working. Phase 4 adds new pages. Phase 5 is deployment.

---

## What NOT to Build (Yet)

- **Email verification** — add when there are real users who need password reset
- **OAuth (Google/GitHub login)** — add as a convenience layer later
- **Rate limiting** — add before going public
- **File uploads** — use external CDN/S3 if lesson images are needed
- **WebSocket** — no real-time needs currently
- **i18n** — premature
- **Email notifications** — not needed
- **Password reset** — add when email verification is implemented
