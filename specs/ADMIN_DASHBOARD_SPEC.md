# Admin Dashboard — Expansion Spec

> **Status:** Planned
> **Target user:** Solo developer (power-user tools, dev-friendly)
> **Architecture:** Hybrid — tools that don't need user data work without backend

---

## Current State

### What's Built

**Frontend** — 8 components in `src/components/admin/`:

| Component | Route | What It Does |
|-----------|-------|-------------|
| `AdminGuard` | — | Route protection, checks `user.role === 'admin'` |
| `AdminLayout` | — | Sidebar nav + content area wrapper |
| `AdminLoginScreen` | `/admin/login` | Username/password login form |
| `AdminDashboard` | `/admin` | Stats cards: users, completions, active 7d, per-level rates |
| `AdminStudentList` | `/admin/students` | Sortable user table (newest / most progress) |
| `AdminLevelList` | `/admin/levels` | Level table with publish toggle |
| `AdminLessonList` | `/admin/lessons` | Lesson table with level filter + publish toggle |
| `AdminLessonEditor` | `/admin/lessons/:id` | Form fields + raw JSON textarea for sections |

**Backend** — `server/src/routes/admin.ts`:
- Full CRUD for levels and lessons (GET, POST, PUT, DELETE)
- Lesson duplicate (`POST /api/admin/lessons/:id/duplicate`) and reorder (`PUT /api/admin/lessons/reorder`) endpoints
- User listing with completion counts, per-user progress detail
- Stats aggregation (per-level completion, active users)
- Zod validation on all mutations
- `requireAuth` + `requireAdmin` middleware

### Known Bugs & Gaps

| # | Issue | Location |
|---|-------|----------|
| 1 | Lesson editor fetches ALL lessons instead of single lesson | `AdminLessonEditor.tsx:32` |
| 2 | Hardcoded `/102` total lessons in student list | `AdminStudentList.tsx` |
| 3 | No level editor UI — can only toggle publish, not edit title/subtitle/emoji | `AdminLevelList.tsx` |
| 4 | No lesson duplication UI — endpoint exists, no button | `AdminLessonList.tsx` |
| 5 | No lesson reorder UI — endpoint exists, no drag/arrows | `AdminLessonList.tsx` |
| 6 | Backend stats `totalPossible: count * 0` initialization bug | `server/src/routes/admin.ts:40` |
| 7 | Inconsistent loading/error states across admin pages | Multiple files |

---

## Phase 1: Fix Existing Gaps

**Priority:** High
**Backend required:** Some fixes need API, some are frontend-only

### 1.1 Fix Lesson Editor Fetch
- Change `AdminLessonEditor` to fetch single lesson by ID instead of all lessons
- Use existing `GET /api/admin/lessons` with level filter, or add `GET /api/admin/lessons/:id` endpoint

### 1.2 Dynamic Lesson Total
- Replace hardcoded `102` in `AdminStudentList` with `LEVELS.reduce((sum, l) => sum + l.lessonCount, 0)` from constants

### 1.3 Level Editor
- Add inline editing to `AdminLevelList`: click title/subtitle to edit in-place
- Fields: title, subtitle, emoji, order
- Save via existing `PUT /api/admin/levels/:id`

### 1.4 Lesson Duplication Button
- Add "Duplicate" action button to each row in `AdminLessonList`
- Calls existing `POST /api/admin/lessons/:id/duplicate`
- Refresh list after duplication

### 1.5 Lesson Reorder
- Add up/down arrow buttons to each row in `AdminLessonList`
- Calls existing `PUT /api/admin/lessons/reorder`
- Visual feedback during reorder

### 1.6 Fix Stats Bug
- Fix `totalPossible` initialization in `server/src/routes/admin.ts`

### 1.7 Shared Loading/Error Components
- Create shared components for consistent UX:
  - `AdminLoadingState` — spinner or skeleton
  - `AdminEmptyState` — "No data" message with icon
  - `AdminPageHeader` — title + optional actions slot
- Retrofit existing pages to use them

**Files to create:**
- `src/components/admin/shared/AdminLoadingState.tsx`
- `src/components/admin/shared/AdminEmptyState.tsx`
- `src/components/admin/shared/AdminPageHeader.tsx`

**Files to modify:**
- `src/components/admin/AdminLessonEditor.tsx`
- `src/components/admin/AdminStudentList.tsx`
- `src/components/admin/AdminLevelList.tsx`
- `src/components/admin/AdminLessonList.tsx`
- `server/src/routes/admin.ts`

---

## Phase 2: New Tools (Hybrid — No Backend Required)

**Priority:** High
**Backend required:** No — these work with static lesson data and client-side state

### 2.1 Theme Editor (`/admin/theme`)

Interactive tool for tuning the app's color and typography tokens.

**Features:**
- Color picker per token (`text-muted`, `text-secondary`, `text-primary`) for both dark and light modes
- Font size sliders with separate mobile/desktop controls (range: 9–18px)
- WCAG contrast ratio calculated live against background colors, with pass/fail badges
- Preview card that simulates HomeScreen layout (level card, lesson rows, counters, "Coming soon")
- Preview updates in real-time as user drags sliders or picks colors
- "Export Theme JSON" — downloads current token values as JSON
- "Copy CSS" — copies the `[data-theme]` CSS block to clipboard

**Implementation notes:**
- Pure client-side — no API calls needed
- Reads current CSS custom property values as defaults
- Does NOT write to `index.css` (dev copies values manually) — avoids runtime file writes
- Based on the `public/test-colors.html` prototype we already built

**Component:** `src/components/admin/AdminThemeEditor.tsx`

### 2.2 Content Validator (`/admin/validate`)

Scans all lesson data for structural issues.

**Checks:**
1. Missing `nextLesson` pointers (lesson has no next and isn't the last in its level)
2. Broken chains (`nextLesson` points to non-existent lesson ID)
3. Empty `sections` arrays
4. Lessons with zero interactive sections (only narrative — potential engagement issue)
5. Duplicate lesson IDs across levels
6. Level `lessonCount` in constants vs actual lesson count mismatch
7. Orphaned lessons (lesson exists but isn't referenced by any level)
8. Missing required fields (title, subtitle, type)

**UI:**
- Checklist with green checkmark / red X per check
- Expandable details showing which lessons fail each check
- Total pass/fail summary at top
- "Re-run" button to refresh after fixes

**Data source:** Static imports from `src/data/levels.ts` + `src/lib/constants.ts`

**Component:** `src/components/admin/AdminContentValidator.tsx`

---

## Phase 3: Lesson Preview & Editor Improvements

**Priority:** Medium
**Backend required:** Hybrid — preview works with static data, save needs API

### 3.1 Lesson Preview (`/admin/lessons/:id/preview`)

Renders lesson sections using the actual interactive components (same ones students see).

**Layout:**
- Desktop: split view — editor on left (40%), live preview on right (60%)
- Mobile: stacked — editor on top, preview below
- Toggle between "Edit" and "Preview" tabs on mobile

**Features:**
- Renders each section through `SectionRenderer` (the same component used in `LessonView`)
- Sections are read-only in preview (no progress tracking, no completion logic)
- Section navigation: click any section in the editor list to scroll preview to it
- Error boundary around preview — shows parse error instead of crashing

**Component:** `src/components/admin/AdminLessonPreview.tsx`

### 3.2 Section-by-Section Editor

Replace the raw JSON textarea in `AdminLessonEditor` with a structured editor.

**Per section:**
- Dropdown to select section type (narrative, quiz, fillInBlank, etc.)
- Type-specific form fields:
  - `narrative`: title, body (textarea), image URL
  - `quiz`: question, options array (add/remove), correct index, explanation
  - `fillInBlank`: prompt, blank position, answer, hints array
  - `terminalStep`: prompt, expected command, success/error messages
  - Other types: similar structured fields matching their TypeScript interfaces
- Add section button (bottom of list)
- Remove section button (per section, with confirmation)
- Reorder sections (up/down arrows)
- "Raw JSON" toggle — switch between structured editor and raw textarea for power users

**Validation:**
- Red border on invalid fields
- Type-check against TypeScript interfaces before save
- Show validation errors inline

**Files to modify:**
- `src/components/admin/AdminLessonEditor.tsx` (major refactor)

---

## Phase 4: Student Detail

**Priority:** Medium
**Backend required:** Yes

### 4.1 Student Detail Page (`/admin/students/:id`)

Drill-down view for individual student progress.

**Sections:**
- **Header:** Username, display name, role badge, joined date
- **Summary bar:** Total lessons completed, current streak, last active
- **Level breakdown:** Accordion per level showing:
  - Progress bar (completed/total)
  - Per-lesson status: checkmark (complete), clock (in progress), dash (not started)
  - Click lesson → shows completion timestamp
- **Activity timeline:** Last 20 progress events (lesson started, lesson completed) with timestamps

**API:** Uses existing `GET /api/admin/users/:id/progress`

**Component:** `src/components/admin/AdminStudentDetail.tsx`

**Files to modify:**
- `src/components/admin/AdminStudentList.tsx` — make rows clickable → navigate to `/admin/students/:id`
- `src/App.tsx` — add route

---

## Phase 5: Analytics

**Priority:** Low
**Backend required:** Yes

### 5.1 Analytics Dashboard (`/admin/analytics`)

Data-driven insights about student engagement.

**Charts (CSS-only, no chart library):**
1. **Completion Funnel** — horizontal bar chart showing how many students completed each level (1 → 2 → ... → 8)
2. **Drop-off Lessons** — top 10 lessons with lowest completion rate (students who started but didn't finish)
3. **Weekly Trends** — bar chart of new users and lesson completions per week (last 8 weeks)
4. **Hardest Lessons** — lessons ranked by average time to complete or highest retry rate

**Backend endpoints to add:**
- `GET /api/admin/analytics/funnel` — per-level student counts
- `GET /api/admin/analytics/dropoff` — per-lesson completion rates, sorted ascending
- `GET /api/admin/analytics/trends?weeks=8` — weekly user registrations and completions

**Component:** `src/components/admin/AdminAnalytics.tsx`

**Files to modify:**
- `server/src/routes/admin.ts` — add 3 analytics endpoints

---

## Navigation Updates

Update `AdminLayout.tsx` sidebar with grouped sections:

```
CONTENT
  Dashboard
  Students
  Levels
  Lessons

TOOLS
  Theme Editor
  Content Validator
  Analytics
```

---

## Route Map (Final)

```
/admin/login         → AdminLoginScreen (no guard)
/admin/*             → AdminGuard → AdminLayout
  /admin             → AdminDashboard
  /admin/students    → AdminStudentList
  /admin/students/:id → AdminStudentDetail
  /admin/levels      → AdminLevelList
  /admin/lessons     → AdminLessonList
  /admin/lessons/:id → AdminLessonEditor
  /admin/lessons/:id/preview → AdminLessonPreview
  /admin/theme       → AdminThemeEditor
  /admin/validate    → AdminContentValidator
  /admin/analytics   → AdminAnalytics
```

---

## Architecture Decisions

1. **No new dependencies** — charts built with CSS flexbox/grid bars, no D3 or Chart.js
2. **Hybrid mode** — Phase 2 tools work entirely from static data imports; Phase 4-5 pages show "Backend required" message when `VITE_USE_API !== 'true'`
3. **Shared components** — `AdminLoadingState`, `AdminEmptyState`, `AdminPageHeader` used across all pages
4. **Consistent data fetching** — all API calls through `apiFetch()` from `src/services/api.ts` (handles auth tokens, refresh)
5. **No new database tables** — analytics queries aggregate existing `progress` and `users` tables

---

## Files Summary

### New Files (10)
| File | Phase |
|------|-------|
| `specs/ADMIN_DASHBOARD_SPEC.md` | — |
| `src/components/admin/shared/AdminLoadingState.tsx` | 1 |
| `src/components/admin/shared/AdminEmptyState.tsx` | 1 |
| `src/components/admin/shared/AdminPageHeader.tsx` | 1 |
| `src/components/admin/AdminThemeEditor.tsx` | 2 |
| `src/components/admin/AdminContentValidator.tsx` | 2 |
| `src/components/admin/AdminLessonPreview.tsx` | 3 |
| `src/components/admin/AdminStudentDetail.tsx` | 4 |
| `src/components/admin/AdminAnalytics.tsx` | 5 |

### Modified Files (8)
| File | Phases |
|------|--------|
| `src/App.tsx` | 1, 3, 4, 5 |
| `src/components/admin/AdminLayout.tsx` | 1, 2 |
| `src/components/admin/AdminDashboard.tsx` | 1 |
| `src/components/admin/AdminLessonEditor.tsx` | 1, 3 |
| `src/components/admin/AdminStudentList.tsx` | 1, 4 |
| `src/components/admin/AdminLevelList.tsx` | 1 |
| `src/components/admin/AdminLessonList.tsx` | 1 |
| `server/src/routes/admin.ts` | 1, 5 |
