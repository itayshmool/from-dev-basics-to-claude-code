# Feature Spec: Admin Impersonation

## Overview
Admins can impersonate any student to see exactly their experience — progress, lessons, dashboard. The admin can interact normally (advance through lessons, complete sections) but **no changes are persisted** to the database. The student's data remains untouched. A persistent banner indicates impersonation is active with a one-click exit.

## User Flow

1. Admin logs in → navigates to Students list
2. Admin clicks **Impersonate** button on a student row
3. App switches to the student's perspective:
   - Home screen shows the student's progress
   - Lessons show the student's current section
   - Dashboard shows the student's stats, achievements, profile
4. A red/amber **banner** is pinned to the top of every page:
   ```
   👁 Viewing as [username] — [Exit Impersonation]
   ```
5. Admin clicks **Exit Impersonation** → returns to admin dashboard with their own session restored

## Backend

### JWT Payload Extension
```ts
interface TokenPayload {
  userId: string;
  role: string;
  impersonatedBy?: string; // admin userId who started impersonation
}
```

### New Endpoint
**`POST /api/admin/impersonate/:userId`**
- Requires: `requireAuth` + `requireAdmin`
- Validates: target user exists and has role `student`
- Returns: `{ accessToken, user: { id, username, displayName, role } }`
- The issued access token has:
  - `userId` = target student's ID
  - `role` = `student`
  - `impersonatedBy` = admin's user ID
- Does **not** set a refresh token cookie (impersonation is short-lived)

### Blocked Routes During Impersonation
A `blockIfImpersonating` middleware checks `req.user.impersonatedBy` and returns `403 Not allowed while impersonating` on:
- `PUT /api/auth/password` — prevent password changes
- `POST /api/bug-reports` — prevent filing issues as the student

### Read-Only Progress
`PUT /api/progress/:lessonId` detects `req.user.impersonatedBy` and returns a success response **without writing to the database**. This means the admin can navigate lessons and complete sections normally in the UI, but the student's actual progress is never modified. Read endpoints (GET progress, stats, achievements) work normally — they show the student's real data.

## Frontend

### Auth Context
New fields on `AuthContextValue`:
- `impersonating: User | null` — the student being impersonated (null when not impersonating)
- `startImpersonation(userId: string): Promise<void>`
- `stopImpersonation(): void`

**`startImpersonation` flow:**
1. Save current admin token + user object in a ref
2. Call `POST /api/admin/impersonate/:userId`
3. Set the returned access token via `setAccessToken()`
4. Set `user` to the returned student object
5. Set `impersonating` to the student object
6. Call `pullProgress()` to load the student's progress
7. Navigate to `/` (home screen)

**`stopImpersonation` flow:**
1. Restore admin token + user from saved ref
2. Set `impersonating` to null
3. Call `pullProgress()` to reload admin's progress
4. Navigate to `/admin`

### Impersonation Banner
New component `ImpersonationBanner` rendered at the top of `App.tsx` when `impersonating` is non-null. Fixed position, high z-index, visually distinct (amber/red background).

### Student List
Add an **Impersonate** button to each row in `AdminStudentList.tsx`. Clicking it calls `startImpersonation(studentId)`.

### UI Guards
- Bug report modal: disabled when impersonating
- Password change form: disabled when impersonating
- These complement the backend 403 blocks

### Token Refresh
During impersonation, the refresh cookie still belongs to the admin session. If the impersonation token expires (15min), the auto-refresh in `apiFetch` will refresh the admin session — not the impersonation. This is acceptable because:
- Impersonation sessions are short (browsing a student's state)
- The admin can simply re-impersonate if the token expires
- Alternatively, `apiFetch` can detect impersonation and skip auto-refresh

## Files Modified
| File | Change |
|------|--------|
| `server/src/lib/jwt.ts` | Add `impersonatedBy?` to `TokenPayload` |
| `server/src/routes/admin.ts` | Add `POST /api/admin/impersonate/:userId` |
| `server/src/middleware/auth.ts` | Add `blockIfImpersonating` middleware |
| `server/src/routes/auth.ts` | Apply `blockIfImpersonating` to password change |
| `server/src/routes/bugReports.ts` | Apply `blockIfImpersonating` |
| `src/contexts/AuthContext.tsx` | Add impersonation state + methods |
| `src/services/authService.ts` | Add `impersonate(userId)` API call |
| `src/components/admin/AdminStudentList.tsx` | Add Impersonate button per row |
| `src/App.tsx` | Render `ImpersonationBanner` |

## Files Created
| File | Purpose |
|------|---------|
| `src/components/layout/ImpersonationBanner.tsx` | Persistent top banner during impersonation |

## Security Considerations
- Only admins can impersonate (enforced by `requireAuth` + `requireAdmin` on the endpoint)
- Impersonation token carries `impersonatedBy` claim for audit trail
- Sensitive actions (password change, bug reports) are blocked server-side
- No refresh token is issued for impersonation — session is inherently time-limited
- Admin's real session is preserved in memory and restored on exit
