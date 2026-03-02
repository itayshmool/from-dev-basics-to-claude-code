# Terminal Trainer — Project Context

## What This Is
An interactive web app teaching non-technical people how to use the terminal. Built with React 18 + TypeScript + Vite + Tailwind CSS v4. Deployed to GitHub Pages via GitHub Actions.

**Live:** https://itayshmool.github.io/from-dev-basics-to-claude-code/

## Current State

### Implemented
- **Level 0** ("Computers Are Not Magic"): 6 lessons fully built and playable
- **Level 1** ("Your First 30 Minutes in the Terminal"): 12 terminal lessons with virtual filesystem, command parser, and interactive terminal UI
- **UX**: Immersive full-screen lessons (Mimo-inspired), no navigation chrome during lessons
- **Theme**: Dark terminal-noir aesthetic — void black palette (#09090B), electric orange accent (#FF6B35), Monaco font identity, system sans-serif body text
- **Home screen**: Lesson picker dashboard with 3-column grid (xl), overall progress indicator, ambient glow effect
- **9 interactive components**: NarrativeBlock, Quiz, FillInBlank, ClickMatch, InteractiveFileTree, PathBuilder, TerminalPreview, ProgramSimulator, TerminalStep
- **Terminal infrastructure**: Virtual filesystem (VFS), command parser, Terminal UI, FileExplorer sidebar, CommandReferenceBar
- **Lesson infrastructure**: LessonStep (shared wrapper with glassmorphism bottom CTA), LessonProgressBar, CelebrationOverlay, slide transitions
- **Progress**: localStorage persistence via useProgress hook

### Not Yet Implemented
- Levels 2-7 content (specs exist in `specs/LEVEL_*_SPEC.md`)
- Real terminal/sandbox (xterm.js, WebContainers) — Level 1 uses in-memory VFS
- User accounts, analytics, i18n

## Architecture
- `App.tsx` — toggles between `HomeScreen` and `LessonView` via `isInLesson` state
- `LessonView.tsx` — orchestrates lesson flow, wraps content in `.lesson-surface` class for lesson context
- `SectionRenderer.tsx` — routes section types to the correct interactive component
- `LessonStep.tsx` — shared layout wrapper: scrollable content area + bottom-fixed CTA button
- `TerminalStep.tsx` — full-width terminal workspace: instruction + terminal + file explorer sidebar
- Theme defined in `src/index.css` via CSS custom properties in `@theme` block
- `.lesson-surface` class overrides theme tokens for lesson context (slightly shifted dark tones)

## Key Files
- `src/index.css` — all theme tokens, animations, and `.lesson-surface` override
- `src/data/levels.ts` — lesson content for Level 0
- `src/data/lessons/level1/` — JSON lesson files for Level 1 (12 lessons)
- `src/core/lesson/types.ts` — section type definitions
- `src/core/lesson/engine.ts` — lesson state machine
- `src/core/terminal/` — TerminalContext, CommandParser for Level 1+ terminal lessons
- `src/core/vfs/VirtualFileSystem.ts` — in-memory virtual filesystem
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
- The `--color-purple` CSS variable is actually electric orange (#FF6B35), not purple. This naming was kept from the original theme to avoid renaming every class reference. All `bg-purple`, `text-purple` etc. render as orange.
- Terminal/code blocks use hardcoded warm dark colors (#2D2B28 background, #38352F titlebar, #F0ECE4 text, #6ABF69 prompt green, #D4A843 highlight gold) — not theme tokens.
- The app uses a dark theme throughout. The `--font-mono` (Monaco) is used as the identity font for headings, labels, and code. `--font-sans` (system SF Pro) is used for body text.
- Old layout components (Header.tsx, Sidebar.tsx, MobileNav.tsx) still exist in `src/components/layout/` but are unused and tree-shaken from the build.
