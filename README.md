# Terminal Trainer

An interactive web app that teaches non-technical people how to use the terminal — from absolute zero to working knowledge.

**Live:** https://itayshmool.github.io/from-dev-basics-to-claude-code/

## What It Does

Terminal Trainer takes beginners through a structured curriculum of interactive lessons. Each lesson uses a mix of narrative explanations, quizzes, fill-in-the-blank exercises, click-to-match games, file tree exploration, path building, terminal previews with animated typing, and program step-through simulators.

## Curriculum

| Level | Title | Status |
|-------|-------|--------|
| 0 | Computers Are Not Magic | Implemented (6 lessons) |
| 1 | Your First 30 Minutes in the Terminal | Spec ready |
| 2 | Reading and Writing Files | Spec ready |
| 3 | Your Code Has a History | Spec ready |
| 4 | How Software Actually Works | Spec ready |
| 5 | Building With Real Tools | Spec ready |
| 6 | Claude Code — Your AI Pair Programmer | Spec ready |
| 7 | Junior Developer Patterns | Spec ready |

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build:** Vite
- **Styling:** Tailwind CSS v4 with CSS custom properties
- **Font:** Instrument Sans (body) + JetBrains Mono (code)
- **Progress:** localStorage
- **Hosting:** GitHub Pages (auto-deploy via GitHub Actions)

## Design

Claude-inspired warm neutral palette:
- Cream background (`#F5F0E8`), white lesson surface
- Terracotta accent (`#C4652A`)
- Warm dark terminals (`#2D2B28`)
- Subtle shadows, no glows, `rounded-xl` corners

The UX follows an immersive lesson model:
- Full-screen lessons with no navigation chrome
- Bottom-fixed CTA buttons
- Thin progress bar with close button
- Slide transitions between sections
- Celebration overlay on correct answers

## Project Structure

```
src/
  App.tsx                          # Root — toggles HomeScreen / LessonView
  index.css                        # Theme tokens + animations
  components/
    home/
      HomeScreen.tsx               # Lesson picker dashboard
    lesson/
      LessonView.tsx               # Lesson orchestrator
      LessonStep.tsx               # Shared layout: scrollable content + fixed CTA
      LessonProgressBar.tsx        # Thin progress bar + close button
      LessonComplete.tsx           # End-of-lesson screen
      MilestoneScreen.tsx          # End-of-level celebration
      CelebrationOverlay.tsx       # "Correct!" overlay
      SectionRenderer.tsx          # Routes sections to interactive components
    interactive/
      NarrativeBlock.tsx           # Story/explanation sections
      Quiz.tsx                     # Multiple choice
      FillInBlank.tsx              # Type the answer
      ClickMatch.tsx               # Match pairs
      InteractiveFileTree.tsx      # Explorable file tree
      PathBuilder.tsx              # Navigate to build a path
      TerminalPreview.tsx          # Animated terminal demo
      ProgramSimulator.tsx         # Step-through code execution
  core/lesson/
    types.ts                       # Section type definitions
    engine.ts                      # Lesson state machine
  data/
    levels.ts                      # Level + lesson content
  hooks/
    useLessonEngine.ts             # React hook for engine
    useProgress.ts                 # Progress persistence
  lib/
    constants.ts                   # Level metadata
specs/
  APP_SPEC.md                      # Full application spec
  LEVEL_0_SPEC.md - LEVEL_7_SPEC.md  # Per-level curriculum specs
```

## Development

```bash
npm install
npm run dev       # Start dev server
npm run build     # TypeScript check + production build
```

## Deployment

Push to `main` triggers GitHub Actions which builds and deploys to GitHub Pages.
