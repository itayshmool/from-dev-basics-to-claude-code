# Color Palette System — Feature Spec

## Overview

Replace the binary light/dark toggle with a multi-palette system. Users choose from curated color palettes. Admins manage the palette library and can generate new palettes via AI.

**Three phases:** user-facing palette picker → admin palette manager → AI palette generation.

---

## Phase 1 — User Palette Picker

**Goal:** Users can select from pre-built palettes. Ships fast, no admin tooling needed yet.

### Data Model

**New DB table: `palettes`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| name | varchar(100) | e.g. "Midnight Ocean", "Warm Ember" |
| slug | varchar(50) UNIQUE | URL-safe key, e.g. "midnight-ocean" |
| colors | jsonb | `{ dark: ThemeOverrides, light: ThemeOverrides }` — same shape as existing theme system |
| is_default | boolean | One palette marked as the app default |
| is_active | boolean | Admin can deactivate without deleting |
| order | integer | Display order in picker |
| created_at | timestamp | |

**Add to `users` table:**

| Column | Type | Notes |
|--------|------|-------|
| palette_id | uuid (nullable, FK → palettes.id) | User's selected palette. NULL = use default palette |

### Seed Palettes

Ship with 6 built-in palettes (colors only, no font changes):

1. **Terminal Noir** (current default) — void black (#09090B) + electric orange (#FF6B35)
2. **Ocean Depth** — deep navy (#0A1628) + cyan accent (#06B6D4)
3. **Forest** — dark green-black (#0A1410) + emerald (#10B981)
4. **Dracula** — classic Dracula theme (#282A36) + purple (#BD93F9)
5. **Solarized Dark** — base03 (#002B36) + solar yellow (#B58900)
6. **Rosé Pine** — base (#191724) + rose (#EB6F92)

Each palette defines overrides for the same ~14 editable tokens the admin theme editor already uses (backgrounds, text, accents, borders) in both dark and light variants.

### Backend API

```
GET    /api/palettes              — List active palettes (public, no auth)
GET    /api/palettes/:slug        — Get single palette (public)
PUT    /api/auth/palette          — Set user's palette preference (auth required)
DELETE /api/auth/palette          — Reset to default (auth required)
```

**GET /api/palettes response:**
```json
[
  {
    "id": "uuid",
    "name": "Terminal Noir",
    "slug": "terminal-noir",
    "colors": { "dark": { "--color-bg-primary": "#09090B", ... }, "light": { ... } },
    "is_default": true,
    "order": 0
  },
  ...
]
```

**PUT /api/auth/palette body:**
```json
{ "paletteId": "uuid" }
```

### Frontend Changes

**Palette picker in DashboardSettings (`src/components/dashboard/DashboardSettings.tsx`):**
- Grid of palette cards (3-column on desktop, 2 on mobile)
- Each card shows: palette name, 5-6 color swatches as circles, checkmark if selected
- Click to select → calls `PUT /api/auth/palette` → applies immediately
- "Reset to default" link

**Theme application flow change (`src/utils/theme.ts`):**
- Current flow: fetch admin theme overrides from `/api/settings/theme` → apply
- New flow:
  1. Fetch active palettes from `/api/palettes` (cache in memory)
  2. Determine user's selected palette (from user object or localStorage fallback)
  3. Apply palette colors as CSS variable overrides (same `setProperty` mechanism)
  4. Admin theme overrides from `/api/settings/theme` layer ON TOP (admin always wins)
- Priority: CSS defaults → user palette → admin overrides

**Replace toggle with picker (`src/hooks/useTheme.ts`):**
- Keep light/dark mode toggle (it controls which sub-object of the palette to apply)
- Add `palette` state and `setPalette(slug)` function
- Store selected palette slug in localStorage as fallback for non-logged-in users

**User type update:**
- Add `paletteId?: string | null` to User interface and auth responses

### Files to Create/Modify

| File | Action |
|------|--------|
| `server/src/db/schema.ts` | Add `palettes` table, add `palette_id` to users |
| `server/drizzle/` | New migration |
| `server/src/db/seed.ts` | Seed 6 default palettes |
| `server/src/routes/palettes.ts` | New route file for palette CRUD |
| `server/src/routes/auth.ts` | Add `PUT/DELETE /api/auth/palette` |
| `server/src/index.ts` | Register palettes router |
| `src/utils/theme.ts` | Add palette layer to theme application |
| `src/hooks/useTheme.ts` | Add palette state and setPalette |
| `src/services/authService.ts` | Add paletteId to User type |
| `src/components/dashboard/DashboardSettings.tsx` | Add palette picker UI |

---

## Phase 2 — Admin Palette Manager

**Goal:** Admins can create, edit, reorder, and delete palettes from the admin dashboard.

### Admin UI

**New page: `/admin/palettes` — Palette Manager**

Add to admin `TOOLS_NAV` in `AdminLayout.tsx`:
```
{ to: '/admin/palettes', label: 'Palettes', end: false }
```

**Palette list view:**
- Table/list of all palettes (active and inactive)
- Each row: color swatches preview, name, slug, active toggle, order handle, edit/delete buttons
- Drag to reorder (or up/down arrows)
- "Create Palette" button at top

**Palette editor (modal or separate page):**
- Same color token groups as existing `AdminThemeEditor` (backgrounds, text, accents, borders)
- Color picker inputs for each token
- Side-by-side dark/light mode editing (reuse pattern from AdminThemeEditor)
- Live preview card showing how the palette looks
- Contrast checker on text tokens (reuse from AdminThemeEditor)
- Name and slug fields (slug auto-generated from name)
- Save / Cancel buttons

**Relationship to existing Theme Editor:**
- The existing `AdminThemeEditor` at `/admin/theme` becomes a "Global Overrides" tool — it applies overrides on top of any palette (font sizes, forced brand colors)
- The Palette Manager is where color schemes are defined
- Clear separation: palettes = color schemes, theme editor = global overrides + font sizes

### Backend API

```
GET    /api/admin/palettes           — List all palettes (including inactive)
POST   /api/admin/palettes           — Create palette
PUT    /api/admin/palettes/:id       — Update palette
DELETE /api/admin/palettes/:id       — Delete palette (fail if it's the default)
PUT    /api/admin/palettes/:id/order — Reorder
PUT    /api/admin/palettes/:id/default — Set as default
```

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/admin/AdminPaletteManager.tsx` | New — palette list + CRUD |
| `src/components/admin/AdminPaletteEditor.tsx` | New — single palette editor |
| `src/components/admin/AdminLayout.tsx` | Add "Palettes" to TOOLS_NAV |
| `src/App.tsx` | Add route `/admin/palettes` |
| `server/src/routes/admin.ts` | Add admin palette CRUD endpoints |

---

## Phase 3 — AI Palette Generator

**Goal:** Admin clicks "Generate Palette" and gets AI-suggested color schemes via the Anthropic API.

### How It Works

1. Admin opens Palette Manager → clicks "Generate with AI" button
2. Optional: admin provides a prompt hint (e.g. "warm sunset tones", "cyberpunk neon", "calm and professional")
3. Backend calls Anthropic API with a structured prompt asking for a color palette in the exact token format
4. API returns a palette JSON → backend validates the shape → returns to frontend
5. Frontend shows the generated palette in a preview card
6. Admin can tweak individual colors, rename it, then save

### Backend

**New endpoint:**
```
POST /api/admin/palettes/generate
```

**Request body:**
```json
{
  "hint": "warm sunset tones",
  "mode": "both"       // "dark", "light", or "both"
}
```

**Implementation (`server/src/lib/paletteGenerator.ts`):**
- Uses Anthropic SDK (`@anthropic-ai/sdk`)
- System prompt defines the exact token structure, constraints (WCAG contrast ratios, background must be dark for dark mode, etc.)
- Asks for a JSON response with `name`, `dark`, and `light` color overrides
- Validates the response shape with Zod before returning
- Strips any non-color data from the response

**Prompt structure:**
```
You are a color palette designer for a dark-themed web app.
Generate a cohesive color palette with these exact CSS variable tokens:

Backgrounds (dark mode should be dark, light mode should be light):
- --color-bg-primary: main background
- --color-bg-secondary: slightly elevated
- --color-bg-card: card surfaces
- --color-bg-elevated: elevated elements (inputs, hover states)

Text (must have WCAG AA contrast against bg-primary):
- --color-text-primary: main text
- --color-text-secondary: secondary text
- --color-text-muted: subtle/disabled text

Accents:
- --color-purple: primary accent (buttons, links, highlights)
- --color-green: success states
- --color-blue: info states
- --color-red: error states
- --color-yellow: warning states

Borders:
- --color-border: subtle border (rgba format)
- --color-border-strong: visible border (rgba format)

Return valid JSON only: { "name": "...", "dark": { ... }, "light": { ... } }
```

**Environment:**
- `ANTHROPIC_API_KEY` env var on backend (Render)
- Model: `claude-sonnet-4-20250514` (fast, cheap, good at structured output)
- Max tokens: 1024 (palette JSON is small)

### Frontend

**In AdminPaletteManager or AdminPaletteEditor:**
- "Generate with AI" button with optional text input for hint
- Loading state with spinner while waiting for API
- Preview card shows generated palette before saving
- "Regenerate" button to try again
- "Save as New Palette" button to persist

### Rate Limiting

- Server-side: max 10 generations per hour per admin
- Simple in-memory counter (no need for Redis at this scale)

### Files to Create/Modify

| File | Action |
|------|--------|
| `server/src/lib/paletteGenerator.ts` | New — Anthropic API call + prompt + validation |
| `server/src/routes/admin.ts` | Add `POST /api/admin/palettes/generate` |
| `server/package.json` | Add `@anthropic-ai/sdk` dependency |
| `src/components/admin/AdminPaletteManager.tsx` | Add generate button + preview UI |

### Environment Variables

| Var | Where | Value |
|-----|-------|-------|
| `ANTHROPIC_API_KEY` | Render backend env | User-provided |

---

## Migration Path

The new palette system coexists with the existing theme system:

1. **Phase 1:** Palettes provide base color schemes. The existing admin theme editor (`/admin/theme`) continues to work as a global override layer that sits on top of palettes. Font sizes stay in the theme editor only.
2. **Phase 2:** Palette manager gives admin a proper UI for managing color schemes. Theme editor narrows to "global overrides + fonts."
3. **Phase 3:** AI generation is an optional tool inside the palette manager.

**No breaking changes.** If no palette is selected, the app uses the default palette (Terminal Noir = current colors). If no admin overrides exist, palettes apply directly.

**Priority chain:** CSS @theme defaults → selected palette → admin global overrides

---

## Not In Scope

- Per-user custom palette creation (users pick from admin-curated palettes only)
- Font family changes (stays in admin theme editor)
- Terminal block theming (remains hardcoded)
- Palette import/export
- Scheduled palette switching (e.g. auto dark at night)
