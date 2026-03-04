# Migration Spec: Frontend from GitHub Pages → Render Static Site

## Goal
Move the frontend from GitHub Pages to Render so the GitHub repo can be made private. Zero manual steps — all actions via Render MCP and GitHub CLI.

## Why
- GitHub Pages requires a public repo on the free plan
- Render static sites are free, CDN-backed, and support private repos
- Single platform for frontend + backend = simpler infrastructure
- Proper SPA rewrite rules (no more `404.html` hack or 404 status codes in DevTools)

## Pre-Migration State

| Component | Host | URL |
|-----------|------|-----|
| Frontend | GitHub Pages | `https://itayshmool.github.io/from-dev-basics-to-claude-code/` |
| Backend | Render Web Service | `https://terminal-trainer-api.onrender.com` |
| Database | Render Postgres | (internal) |

### GitHub Pages Dependencies
- `.github/workflows/deploy.yml` — builds and deploys frontend
- `vite.config.ts` — `base: '/from-dev-basics-to-claude-code/'` (subpath required by GitHub Pages)
- `src/main.tsx` — `<BrowserRouter basename="/from-dev-basics-to-claude-code/">"`
- GitHub repo variables: `VITE_USE_API`, `VITE_API_URL`, `VITE_TURNSTILE_SITE_KEY`
- SPA routing: `cp dist/index.html dist/404.html` in deploy workflow

## Post-Migration State

| Component | Host | URL |
|-----------|------|-----|
| Frontend | Render Static Site | `https://terminal-trainer.onrender.com` |
| Backend | Render Web Service | `https://terminal-trainer-api.onrender.com` |
| Database | Render Postgres | (internal) |

## GitHub Issues Feature — No Impact

The bug report → GitHub Issues flow is **server-side only**:
- Backend (`server/src/routes/bugReports.ts`) uses `GITHUB_PAT` env var to call the GitHub API
- The PAT authenticates directly — repo visibility is irrelevant
- **Requirement:** The PAT must have `repo` scope (which grants access to private repos)
- **Verification step:** Confirm `GITHUB_PAT` has `repo` scope before making repo private

## Migration Steps

All steps use Render MCP tools and `gh` CLI. No manual dashboard/browser work.

### Step 1: Update Frontend Code for Root-Path Hosting

GitHub Pages serves from a subpath (`/from-dev-basics-to-claude-code/`). Render serves from root (`/`).

**Changes:**
1. `vite.config.ts` — change `base` from `'/from-dev-basics-to-claude-code/'` to `'/'`
2. `src/main.tsx` — change `basename` from `"/from-dev-basics-to-claude-code/"` to `"/"`

### Step 2: Create Render Static Site

**Tool:** `mcp__render__create_static_site`

| Field | Value |
|-------|-------|
| name | `terminal-trainer` |
| repo | `https://github.com/itayshmool/from-dev-basics-to-claude-code` |
| branch | `main` |
| buildCommand | `npm install && npm run build` |
| publishPath | `dist` |
| autoDeploy | `yes` |

### Step 3: Set Environment Variables on Render Static Site

**Tool:** `mcp__render__update_environment_variables`

| Variable | Value |
|----------|-------|
| `VITE_USE_API` | `true` |
| `VITE_API_URL` | `https://terminal-trainer-api.onrender.com` |
| `VITE_TURNSTILE_SITE_KEY` | `0x4AAAAAACmX1Q1qUgrX3eOY` |

### Step 4: Update Backend CORS Origin

**Tool:** `mcp__render__update_environment_variables` on `srv-d6jbmbp4tr6s739ccvcg`

Update `CORS_ORIGIN` to include the new Render frontend URL:
```
https://terminal-trainer.onrender.com,https://terminal-trainer-api.onrender.com
```

This replaces the old `https://itayshmool.github.io` origin.

### Step 5: Update Cloudflare Turnstile Allowed Hostname

**Tool:** Cloudflare MCP (if permissions available) or `gh` CLI note

Add `terminal-trainer.onrender.com` to the Turnstile widget's allowed hostnames.
Remove `itayshmool.github.io` (optional, can keep for transition).

> **Note:** The Cloudflare MCP currently lacks Turnstile permissions. This is the **one step** that may require the Cloudflare dashboard, OR re-authenticating the MCP with Turnstile scope. Document as a manual fallback if MCP can't do it.

### Step 6: Verify Deployment

1. Wait for Render build to complete — check via `mcp__render__list_deploys`
2. Verify frontend loads at `https://terminal-trainer.onrender.com`
3. Verify API connectivity (login, lesson loading)
4. Verify bug report submission creates a GitHub Issue
5. Verify Turnstile widget renders

### Step 7: Disable GitHub Pages

**Tool:** `gh` CLI

```bash
gh api repos/itayshmool/from-dev-basics-to-claude-code/pages -X DELETE
```

### Step 8: Remove GitHub Actions Deploy Workflow

Delete `.github/workflows/deploy.yml` — no longer needed since Render handles deployment.

### Step 9: Clean Up GitHub Repo Variables

**Tool:** `gh` CLI

Remove the variables that were only used by the GitHub Actions workflow:
```bash
gh variable delete VITE_USE_API
gh variable delete VITE_API_URL
gh variable delete VITE_TURNSTILE_SITE_KEY
```

These are now set as Render environment variables instead.

### Step 10: Make Repo Private

**Tool:** `gh` CLI

```bash
gh repo edit itayshmool/from-dev-basics-to-claude-code --visibility private
```

### Step 11: Update Documentation

Update the following files to reflect new URLs and deployment flow:
- `CLAUDE.md` — update live URL, deployment instructions, architecture description
- `specs/DEPLOYMENT_SPEC.md` — rewrite frontend section for Render

## Rollback Plan

If something goes wrong:
1. Revert `vite.config.ts` and `src/main.tsx` base path changes
2. Re-enable GitHub Pages: `gh api repos/itayshmool/from-dev-basics-to-claude-code/pages -X POST -f source.branch=main`
3. Restore GitHub repo variables
4. Delete the Render static site
5. Make repo public again if it was already made private

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Turnstile hostname update requires manual step | Widget won't render on new domain | Add hostname before switching; keep old hostname during transition |
| Render static site name `terminal-trainer` taken | Can't use preferred URL | Use alternative name like `terminal-trainer-app` |
| Cookie `sameSite: 'none'` still needed | No change — different subdomains | No action needed, already configured |
| GitHub PAT lacks `repo` scope | Bug reports break on private repo | Verify PAT scope before making repo private |
| Users have bookmarked old GitHub Pages URL | Broken links | No mitigation on free tier (no redirect control on GitHub Pages once disabled) |

## Execution Order Summary

```
1.  Code changes (base path → '/')
2.  Create Render static site
3.  Set frontend env vars on Render
4.  Update backend CORS_ORIGIN
5.  Update Turnstile hostname
6.  Verify deployment works end-to-end
7.  Disable GitHub Pages
8.  Delete deploy workflow
9.  Clean up GitHub repo variables
10. Make repo private
11. Update docs (CLAUDE.md, DEPLOYMENT_SPEC.md)
```
