# User Dashboard — Multi-Phase Spec

> **Status:** Complete (All 4 phases implemented)
> **Target user:** Logged-in students
> **Architecture:** Backend-only (requires authentication, no localStorage fallback)

---

## Overview

A dedicated `/dashboard` route for authenticated users providing profile management, progress analytics, achievements, and smart lesson continuation. Mirrors the admin dashboard architecture (guard → layout → child routes) but accessible to any logged-in user.

---

## Phase 1: Profile & Account Settings

**Priority:** High — Foundation for all subsequent phases

### Backend Endpoints

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/auth/me` | Full profile including `createdAt` | Required |
| PUT | `/api/auth/profile` | Update `displayName` | Required |
| PUT | `/api/auth/password` | Change password (verify current first) | Required |

**`GET /api/auth/me`** returns:
```json
{ "id": "uuid", "username": "alice", "displayName": "Alice", "role": "student", "createdAt": "2026-02-15T..." }
```

**`PUT /api/auth/profile`** accepts `{ displayName: string }` (1-100 chars), returns updated user object.

**`PUT /api/auth/password`** accepts `{ currentPassword: string, newPassword: string }` (newPassword min 8 chars). Returns `{ ok: true }` or 401 if current password wrong.

### Frontend Components

| Component | Route | Purpose |
|-----------|-------|---------|
| `DashboardGuard` | — | Auth gate: redirect to `/login` if not logged in |
| `DashboardLayout` | — | Sidebar nav + Outlet wrapper |
| `DashboardProfile` | `/dashboard` (index) | View/edit profile, member since date |
| `DashboardSettings` | `/dashboard/settings` | Change password form |

### DashboardLayout Sidebar Nav
- Profile (`/dashboard`) — user icon
- Settings (`/dashboard/settings`) — gear icon
- Back to Home (`/`) link
- Logout button
- User avatar (first letter of displayName) + display name shown at top

### DashboardProfile
- Avatar circle (first letter, bg-purple)
- Display name (editable inline — click Edit → input + Save/Cancel)
- Username (`@username`, read-only)
- Role badge (student / admin)
- Member since (formatted date from `createdAt`)

### DashboardSettings
- Change password form: current password, new password, confirm new password
- Client validation: min 8 chars, confirm must match
- Success/error messages
- Form styling matches existing LoginScreen inputs

### Modified Files
- `src/App.tsx` — add `/dashboard/*` routes
- `src/components/home/HomeScreen.tsx` — add "Dashboard" link for logged-in users
- `src/contexts/AuthContext.tsx` — add `updateUser()` method
- `server/src/routes/auth.ts` — add 3 endpoints

### DB Migration
None — existing `users` table has all needed fields.

---

## Phase 2: Progress Stats & Activity

**Priority:** Medium — Core analytics for user engagement

### Backend Endpoint

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/progress/stats` | Aggregated stats for current user | Required |

**Response:**
```json
{
  "totalCompleted": 12,
  "totalLessons": 102,
  "completionPercent": 12,
  "currentStreak": 3,
  "longestStreak": 5,
  "levelBreakdown": [
    { "level": 0, "title": "Computers Are Not Magic", "completed": 6, "total": 6 }
  ],
  "recentActivity": [
    { "lessonId": "1.12", "lessonTitle": "Review & Next Steps", "completedAt": "2026-03-03T..." }
  ]
}
```

**Streak calculation:** Count consecutive calendar days (backward from today) with at least one `completedAt` timestamp.

### Frontend Components

| Component | Route | Purpose |
|-----------|-------|---------|
| `DashboardStats` | `/dashboard/stats` | Stat cards + activity + level breakdown |
| `ActivityTimeline` | — (child of Stats) | Vertical timeline of recent completions |
| `LevelBreakdown` | — (child of Stats) | Per-level progress grid |

### DashboardStats Layout
1. **3 stat cards row:** Lessons Completed (X/102), Completion %, Current Streak (X days)
2. **Level Breakdown:** Grid of level cards with emoji, title, progress bar, fraction
3. **Recent Activity:** Vertical timeline with lesson title, level badge, relative time

### Modified Files
- `DashboardLayout.tsx` — add "Stats" nav item
- `src/App.tsx` — add stats route
- `server/src/routes/progress.ts` — add stats endpoint

---

## Phase 3: Achievements & Badges

**Priority:** Medium — Gamification for retention

### Achievement System

Achievements are **computed server-side** from existing progress data. No new DB table — avoids migration complexity. Achievement definitions live in a static registry.

**Categories:**
| Category | Achievements |
|----------|-------------|
| Milestones | First Step (1 lesson), Getting Started (5), Halfway There (51), Graduate (102) |
| Level Mastery | "Level N Complete" for each of 8 levels |
| Streaks | 3-Day Streak, 7-Day Streak, 30-Day Streak |
| Speed | Quick Learner (5 lessons in one day) |

**Total: ~16 achievements**

### Backend

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/progress/achievements` | Computed earned + available badges | Required |

**Response:**
```json
{
  "earned": [
    { "id": "first_step", "title": "First Step", "icon": "\ud83d\udc76", "earnedAt": "2026-02-15T..." }
  ],
  "available": [
    { "id": "halfway", "title": "Halfway There", "icon": "\ud83c\udfc3", "progress": 0.24 }
  ],
  "totalEarned": 5,
  "totalAvailable": 16
}
```

### Frontend Components

| Component | Route/Location | Purpose |
|-----------|---------------|---------|
| `DashboardAchievements` | `/dashboard/achievements` | Trophy case grid |
| `AchievementBadge` | — (reusable) | Single badge card (earned vs locked) |
| `AchievementToast` | — (floating UI) | Toast notification on new achievement |
| `AchievementContext` | — (provider) | Manages toast queue |

### Achievement Toast Flow
1. User completes lesson → `LessonView` calls achievement check
2. Compare before/after achievement lists
3. New achievements trigger toast: slides in from top-right, auto-dismisses 5s
4. Glassmorphism style: `bg-bg-card/90 backdrop-blur-xl border-purple/30`

### New Files
- `server/src/lib/achievements.ts` — registry + check functions
- Frontend components as listed above

---

## Phase 4: Smart Continue & Recommendations

**Priority:** Low — Polish & engagement optimization

### Backend Endpoint

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/progress/continue` | Smart continuation data | Required |

**Response:**
```json
{
  "continueLesson": { "lessonId": "2.3", "title": "...", "level": 2, "sectionIndex": 4, "totalSections": 8 },
  "nextLesson": { "lessonId": "2.4", "title": "...", "level": 2 },
  "lessonsPerDay": 1.5,
  "estimatedDaysToComplete": 60,
  "completionPercent": 12
}
```

### Frontend Components

| Component | Route | Purpose |
|-----------|-------|---------|
| `DashboardOverview` | `/dashboard` (new index) | Hero continue CTA, up-next cards, pace stats |

### Layout Changes
- DashboardOverview becomes the `/dashboard` index route
- DashboardProfile moves to `/dashboard/profile`
- Nav reordered: Overview, Stats, Achievements, Profile, Settings

### HomeScreen Enhancement
- For logged-in users: subtle "Continue Learning" banner at top linking to dashboard

---

## Theme & Styling Rules

All dashboard components use the existing dark terminal-noir theme:
- Page bg: inherited `bg-bg-primary`
- Sidebar: `bg-bg-card border-r border-border`
- Cards: `bg-bg-card rounded-xl border border-border shadow-card`
- Active nav: `bg-purple-soft text-purple`
- Headings: `font-mono text-text-primary`
- Body: `text-text-secondary`
- Buttons: `bg-purple text-white rounded-lg shadow-button`
- Inputs: `bg-bg-elevated border border-border text-text-primary font-mono`

---

## Deployment Notes

- Each phase is independently deployable
- No DB migrations in any phase
- All endpoints are additive (no breaking changes)
- Backend auto-deploys on push to `main` via Render
- Frontend auto-deploys via GitHub Actions to GitHub Pages
