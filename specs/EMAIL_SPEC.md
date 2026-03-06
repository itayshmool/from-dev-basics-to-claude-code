# Email System — Feature Specification

> **Status:** In Progress
> **Provider:** Resend
> **Domain:** zero2claude.dev
> **Sender:** noreply@zero2claude.dev

---

## Overview

Transactional email system for the From Zero to Claude Code platform. Supports 4 email types: welcome, email verification, forgot password, and bug report confirmation. Includes an admin management page for toggling email types and viewing send history.

Emails are sent via the Resend API. All sends are fire-and-forget — email failures never block the main request flow. Every send attempt is logged to the `email_log` table for admin visibility.

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────┐
│  Frontend    │────▶│  Express API │────▶│  Resend │
│  (React)     │     │  (email.ts)  │     │  API    │
└─────────────┘     └──────┬───────┘     └─────────┘
                           │
                    ┌──────▼───────┐
                    │  PostgreSQL  │
                    │  email_log   │
                    │  tokens      │
                    └──────────────┘
```

**Key design decisions:**
- Token-based flows (verification, password reset) use SHA-256 hashed tokens in DB — raw token only exists in the email link
- All email sends go through `sendAndLog()` which catches errors internally and logs to `email_log`
- Email type enable/disable settings stored in `site_settings` table (key: `email_settings`)
- Rate limiting uses in-memory Map (same pattern as `bugReports.ts`)

---

## Email Types

### 1. Welcome Email
- **Trigger:** User registration (when email is provided)
- **Recipient:** New user's email
- **Content:** Greeting, app description, "Start Learning" CTA button
- **CTA URL:** `{FRONTEND_URL}`

### 2. Email Verification
- **Trigger:** Registration with email, or email change on profile
- **Recipient:** User's email address
- **Content:** "Verify your email" message, CTA button, 24-hour expiry note
- **CTA URL:** `{FRONTEND_URL}/verify-email?token={raw_token}`
- **Token:** 32 random bytes → 64-char hex string
- **Storage:** SHA-256 hash in `email_verification_tokens` table
- **Expiry:** 24 hours
- **Behavior:** Previous unverified tokens for the same user are invalidated on re-request

### 3. Forgot Password
- **Trigger:** User submits forgot password form
- **Recipient:** User's registered email
- **Content:** "Reset your password" message, CTA button, 1-hour expiry note
- **CTA URL:** `{FRONTEND_URL}/reset-password?token={raw_token}`
- **Token:** 32 random bytes → 64-char hex string
- **Storage:** SHA-256 hash in `password_reset_tokens` table
- **Expiry:** 1 hour
- **Security:** Endpoint always returns `{ ok: true }` regardless of whether user exists (prevents user enumeration)

### 4. Bug Report Confirmation
- **Trigger:** Successful bug report submission (GitHub issue created)
- **Recipient:** Reporting user's email (if they have one)
- **Content:** Confirmation with GitHub issue number
- **Fire-and-forget:** Sent after bug report response, never blocks the response

---

## Database Schema

### New Table: `email_verification_tokens`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default random |
| userId | uuid | FK → users(id) ON DELETE CASCADE, NOT NULL |
| email | varchar(255) | NOT NULL |
| tokenHash | varchar(255) | NOT NULL |
| expiresAt | timestamp with tz | NOT NULL |
| usedAt | timestamp with tz | nullable |
| createdAt | timestamp with tz | default now, NOT NULL |

### New Table: `password_reset_tokens`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, default random |
| userId | uuid | FK → users(id) ON DELETE CASCADE, NOT NULL |
| tokenHash | varchar(255) | NOT NULL |
| expiresAt | timestamp with tz | NOT NULL |
| usedAt | timestamp with tz | nullable |
| createdAt | timestamp with tz | default now, NOT NULL |

### New Table: `email_log`

| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| emailType | varchar(50) | NOT NULL |
| recipientEmail | varchar(255) | NOT NULL |
| recipientUserId | uuid | FK → users(id) ON DELETE SET NULL, nullable |
| subject | varchar(500) | NOT NULL |
| resendId | varchar(255) | nullable |
| status | varchar(20) | NOT NULL (sent / failed) |
| errorMessage | text | nullable |
| createdAt | timestamp with tz | default now, NOT NULL |

### Modified Table: `users`

| New Column | Type | Default |
|------------|------|---------|
| emailVerified | boolean | false |
| emailVerifiedAt | timestamp with tz | nullable |

---

## API Endpoints

### Public Email Routes (`/api/email`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/email/forgot-password` | None | Request password reset |
| POST | `/api/email/reset-password` | None | Reset password with token |
| POST | `/api/email/verify` | None | Verify email with token |
| POST | `/api/email/resend-verification` | Required | Resend verification email |

#### POST `/api/email/forgot-password`

**Request:**
```json
{ "username": "alice" }
```

**Response:** Always `200 { "ok": true }` (no user enumeration)

**Behavior:**
1. Look up user by username
2. If user exists and has email → generate token, hash it, store in `password_reset_tokens`, send email
3. If user not found or no email → return success anyway (silent)
4. Invalidate any previous unused tokens for this user

**Rate limit:** 3 requests per 15 minutes per username+IP combination

#### POST `/api/email/reset-password`

**Request:**
```json
{ "token": "64-char-hex", "newPassword": "newpassword123" }
```

**Response:** `200 { "ok": true }` or `400 { "error": "Invalid or expired reset link" }`

**Behavior:**
1. SHA-256 hash the token
2. Look up in `password_reset_tokens` where hash matches, not expired, not used
3. Update user's password hash
4. Mark token as used (set `usedAt`)

#### POST `/api/email/verify`

**Request:**
```json
{ "token": "64-char-hex" }
```

**Response:** `200 { "ok": true }` or `400 { "error": "Invalid or expired verification link" }`

**Behavior:**
1. SHA-256 hash the token
2. Look up in `email_verification_tokens` where hash matches, not expired, not used
3. Set `emailVerified = true` and `emailVerifiedAt = now()` on user
4. Mark token as used

#### POST `/api/email/resend-verification`

**Auth:** Required (JWT)

**Response:** `200 { "ok": true }` or `429` if rate limited

**Rate limit:** 1 request per 5 minutes per user

**Behavior:**
1. Get current user's email
2. If no email → return error
3. Invalidate previous tokens, generate new one, send

### Modified Auth Routes

#### GET `/api/auth/me`
Add `emailVerified` (boolean) to response.

#### POST `/api/auth/register`
Accept optional `email` field. If provided:
- Send welcome email (fire-and-forget)
- Generate verification token and send verification email

#### PUT `/api/auth/profile`
When email changes:
- Set `emailVerified = false`
- Generate verification token and send verification email

### Modified Bug Report Route

#### POST `/api/bug-reports`
After successful GitHub issue creation, fire-and-forget `sendBugSubmittedEmail()` if user has email.

### Admin Email Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/email/log` | Admin | Paginated email send history |
| GET | `/api/admin/email/log/stats` | Admin | Aggregate counts by type/status |

#### GET `/api/admin/email/log`

**Query params:** `page` (default 1), `limit` (default 50), `type` (optional filter)

**Response:**
```json
{
  "logs": [
    {
      "id": 1,
      "emailType": "welcome",
      "recipientEmail": "alice@example.com",
      "subject": "Welcome to From Zero to Claude Code",
      "status": "sent",
      "resendId": "re_123abc",
      "errorMessage": null,
      "createdAt": "2026-03-06T..."
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 50
}
```

#### GET `/api/admin/email/log/stats`

**Response:**
```json
{
  "byType": { "welcome": 20, "verification": 15, "password_reset": 5, "bug_submitted": 2 },
  "byStatus": { "sent": 38, "failed": 4 },
  "total": 42
}
```

---

## Security Model

### Token Security
- Tokens are 32 random bytes (crypto.randomBytes), rendered as 64-char hex
- Only the SHA-256 hash is stored in the database
- Raw token travels only via email link → user's browser → API request
- Tokens are one-time use: `usedAt` is set after consumption
- Expiry enforced server-side (24h for verification, 1h for password reset)
- Previous unused tokens are invalidated when a new one is requested

### Rate Limiting
- In-memory Map with sliding window (same pattern as existing `bugReports.ts`)
- Forgot password: 3 requests per 15 minutes per username+IP
- Resend verification: 1 request per 5 minutes per userId
- Limits reset on server restart (acceptable for this scale)

### No User Enumeration
- `POST /api/email/forgot-password` always returns `{ ok: true }`
- Whether or not the username exists or has an email is never revealed

---

## Email Templates

All templates use inline CSS with table layout for email client compatibility.

**Visual style:**
- Background: `#09090B` (void black)
- Card: `#141419` (elevated surface)
- Accent: `#FF6B35` (electric orange — the brand color)
- Text: `#E8E5E0` (primary text)
- Muted text: `#6B6B6B`
- Font: system sans-serif stack (Monaco not reliable in email clients)
- CTA buttons: `#FF6B35` background, white text, rounded

**Template functions (in `server/src/lib/emailTemplates.ts`):**
- `welcomeTemplate(displayName, appUrl)` → Welcome email HTML
- `verificationTemplate(displayName, verifyUrl)` → Verification email HTML
- `passwordResetTemplate(displayName, resetUrl)` → Password reset email HTML
- `bugSubmittedTemplate(displayName, issueNumber)` → Bug confirmation email HTML

---

## Admin Email Management

### Location
`/admin/email` — new admin page accessible from the admin sidebar.

### Sections

**1. Email Templates**
- Card per email type (welcome, verification, password_reset, bug_submitted)
- Toggle enabled/disabled per type
- Editable subject line (inline edit with save)
- Settings persisted to `site_settings` table (key: `email_settings`)

**2. Send History**
- Table: date, type (color badge), recipient, subject, status (sent/failed badge)
- Paginated (50 per page)
- Filterable by email type
- Loads from `GET /api/admin/email/log`

---

## Frontend Screens

### Forgot Password (`/forgot-password`)
- Username input field
- Submit button
- On success: "If an account with that username exists and has an email, we've sent a reset link."
- Link back to login

### Reset Password (`/reset-password?token=...`)
- Reads `token` from URL query params
- New password + confirm password fields
- On success: "Password reset successfully" + link to login
- On error: "Invalid or expired link" + link to request new one

### Verify Email (`/verify-email?token=...`)
- Reads `token` from URL query params
- Auto-submits on mount
- Loading → Success ("Email verified!") or Error message

### Dashboard Profile Updates
- Verification badge next to email: green "Verified" or yellow "Unverified"
- "Resend verification" button when unverified (calls `POST /api/email/resend-verification`)

### Login Screen
- "Forgot password?" link below the password field

### Register Screen
- Optional email field added to registration form

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | No | Resend API key. If absent, emails are skipped (logged as disabled) |
| `FRONTEND_URL` | No | Base URL for email links (e.g., `https://zero2claude.dev`). Defaults to `http://localhost:5173` |

Both are optional for graceful degradation — the app works without email configured.

---

## Email Settings Schema

Stored in `site_settings` table with key `email_settings`:

```json
{
  "welcome": {
    "enabled": true,
    "subject": "Welcome to From Zero to Claude Code"
  },
  "verification": {
    "enabled": true,
    "subject": "Verify your email"
  },
  "password_reset": {
    "enabled": true,
    "subject": "Reset your password"
  },
  "bug_submitted": {
    "enabled": true,
    "subject": "Bug report received"
  }
}
```

Default subjects are used when no DB override exists.

---

## File Inventory

### New Files (12)
| File | Purpose |
|------|---------|
| `specs/EMAIL_SPEC.md` | This specification |
| `server/src/lib/emailTemplates.ts` | 4 HTML template functions |
| `server/src/lib/email.ts` | Resend client, token utils, send functions, logging |
| `server/src/routes/email.ts` | Public email routes (forgot/reset/verify) |
| `server/drizzle/0004_*.sql` | Auto-generated migration |
| `server/src/routes/email.test.ts` | Email route tests (~12 cases) |
| `server/src/lib/email.test.ts` | Email service unit tests (~8 cases) |
| `server/src/lib/emailTemplates.test.ts` | Template unit tests (~4 cases) |
| `src/components/auth/ForgotPasswordScreen.tsx` | Forgot password form |
| `src/components/auth/ResetPasswordScreen.tsx` | Reset password form |
| `src/components/auth/VerifyEmailScreen.tsx` | Email verification handler |
| `src/components/admin/AdminEmailManager.tsx` | Admin email settings + history |

### Modified Files (10+)
| File | Change |
|------|--------|
| `server/package.json` | Add `resend` dependency |
| `server/src/lib/env.ts` | Add `RESEND_API_KEY`, `FRONTEND_URL` |
| `server/src/db/schema.ts` | 3 new tables + 2 user columns |
| `server/src/routes/auth.ts` | Welcome/verification emails on register, `emailVerified` in /me |
| `server/src/routes/bugReports.ts` | Bug confirmation email |
| `server/src/routes/admin.ts` | Email log endpoints |
| `server/src/index.ts` | Register email router |
| `src/App.tsx` | 4 new routes |
| `src/components/admin/AdminLayout.tsx` | "Email" nav item |
| `src/components/auth/LoginScreen.tsx` | "Forgot password?" link |
| `src/components/auth/RegisterScreen.tsx` | Optional email field |
| `src/components/dashboard/DashboardProfile.tsx` | Verification badge + resend button |
| `src/services/authService.ts` | `emailVerified` in User interface |
