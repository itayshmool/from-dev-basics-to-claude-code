# Terminal Trainer — Project Context

## What This Is
An interactive web app teaching non-technical people how to use the terminal. Built with React 18 + TypeScript + Vite + Tailwind CSS v4. Deployed to GitHub Pages via GitHub Actions.

**Live:** https://itayshmool.github.io/from-dev-basics-to-claude-code/

## Current State

### Implemented
- **Level 0** ("Computers Are Not Magic"): 6 lessons fully built and playable
- **UX**: Immersive full-screen lessons (Mimo-inspired), no navigation chrome during lessons
- **Theme**: Claude web/desktop app aesthetic — warm cream/beige palette, terracotta accent (#C4652A), Instrument Sans font
- **Home screen**: Lesson picker dashboard with levels, progress bars, lesson status icons
- **8 interactive components**: NarrativeBlock, Quiz, FillInBlank, ClickMatch, InteractiveFileTree, PathBuilder, TerminalPreview, ProgramSimulator
- **Lesson infrastructure**: LessonStep (shared wrapper with bottom-fixed CTA), LessonProgressBar, CelebrationOverlay, slide transitions
- **Progress**: localStorage persistence via useProgress hook

### Not Yet Implemented
- Levels 1-7 content (specs exist in `specs/LEVEL_*_SPEC.md`)
- Real terminal/sandbox (xterm.js, WebContainers) — current Level 0 is conceptual only
- User accounts, analytics, i18n

## Architecture
- `App.tsx` — toggles between `HomeScreen` and `LessonView` via `isInLesson` state
- `LessonView.tsx` — orchestrates lesson flow, wraps content in `.lesson-surface` class for light theme
- `SectionRenderer.tsx` — routes section types to the correct interactive component
- `LessonStep.tsx` — shared layout wrapper: scrollable content area + bottom-fixed CTA button
- Theme defined in `src/index.css` via CSS custom properties in `@theme` block
- `.lesson-surface` class overrides theme tokens for white lesson background

## Key Files
- `src/index.css` — all theme tokens, animations, and `.lesson-surface` override
- `src/data/levels.ts` — lesson content for Level 0
- `src/core/lesson/types.ts` — section type definitions
- `src/core/lesson/engine.ts` — lesson state machine
- `src/lib/constants.ts` — LEVELS array (metadata for all 8 levels)
- `specs/APP_SPEC.md` — full application specification

## Dev Commands
```bash
npm run dev       # Start dev server
npm run build     # TypeScript check + production build
```

## Deployment
Push to `main` → GitHub Actions auto-builds and deploys to GitHub Pages.

## Important Notes
- The `--color-purple` CSS variable is actually terracotta (#C4652A), not purple. This naming was kept from the original Mimo theme to avoid renaming every class reference. All `bg-purple`, `text-purple` etc. render as terracotta.
- Terminal/code blocks use hardcoded warm dark colors (#2D2B28 background, #38352F titlebar, #F0ECE4 text, #6ABF69 prompt green, #D4A843 highlight gold) — not theme tokens.
- Old layout components (Header.tsx, Sidebar.tsx, MobileNav.tsx) still exist in `src/components/layout/` but are unused and tree-shaken from the build.
