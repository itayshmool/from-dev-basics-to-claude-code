# AI Provider Selection and Preflight Test Spec

## Scope
- Keep existing Anthropic integration.
- Add a parallel Gemini integration using the same generation workflow for:
  - onboarding plan generation
  - admin palette generation
- Let admins choose the active provider from the admin onboarding page.
- Let admins test provider connectivity before enabling it for end users.

## Functional Requirements
1. Provider selection
- Store active provider in `site_settings` as `ai_provider`.
- Supported values: `anthropic`, `gemini`.
- Default/fallback provider: `anthropic` when setting is missing.

2. Generation behavior
- Onboarding generation must read the selected provider at request time.
- Palette generation must read the selected provider at request time.
- Keep existing prompts, validation, and rate limits.

3. Provider test endpoint
- Add `POST /api/admin/onboarding/test-provider`.
- Request body: `{ provider: "anthropic" | "gemini" }`.
- Endpoint executes a short test prompt with the requested provider and returns:
  - `success`
  - `provider`
  - `model`
  - `latencyMs`
  - `usage` (normalized input/output/total token counts when available)
  - `preview` (short output snippet)
- Endpoint is admin-only.

4. Admin UI
- Add provider toggle in `/admin/onboarding`.
- Add separate usage cards for Anthropic and Gemini.
- Add explicit test actions for each provider.
- Show pass/fail result and payload details from the test endpoint.

## Usage Tracking
- `GET /api/admin/onboarding/stats` returns:
  - existing totals and recent logs
  - `provider` (current active provider)
  - `usageByProvider`:
    - `anthropic`: generations, inputTokens, outputTokens, totalTokens
    - `gemini`: generations, inputTokens, outputTokens, totalTokens

## Environment
- Required/optional keys by provider:
  - `ANTHROPIC_API_KEY` for Anthropic
  - `GEMINI_API_KEY` for Gemini
- Missing key for selected/tested provider must return clear 4xx error details.

## Testing Requirements
- Server tests
  - provider selection fallback/default behavior
  - onboarding generation routes with provider-specific paths
  - provider test endpoint success/failure flows
  - stats payload includes provider split fields
- Frontend tests
  - provider toggle render and save
  - provider usage cards render
  - provider test button flows (loading/success/error states)
