# Terminal Trainer — Application Specification

## Overview

Terminal Trainer is a free, interactive, text-based web application that takes non-technical people from zero computer science knowledge to junior developer capability, using Claude Code as the primary development tool.

## Mission

Eliminate the fear of the terminal and build real developer skills for people who have never written a line of code.

## Target Audience

- Non-technical professionals (marketers, designers, managers, writers)
- Career switchers exploring software development
- Entrepreneurs who want to build their own tools
- Anyone curious about coding but intimidated by the terminal

### Audience Assumptions

- Can use a web browser, send email, install apps
- Have never opened a terminal
- Have never written code
- May have anxiety about "breaking something"
- Own a Mac or Windows computer

## Learning Philosophy

### Core Principles

1. **Analogy-first**: Every new concept is introduced with a real-world analogy before the technical explanation
2. **Type-to-learn**: Students learn by typing real commands, not by reading documentation
3. **Visual reinforcement**: Every terminal action has a visual mirror (file explorer, diagrams) that shows what happened
4. **Progressive disclosure**: Start with exact instructions, gradually remove guardrails until students work independently
5. **Safe-to-fail**: The sandbox environment makes it impossible to break anything. Mistakes are learning opportunities, not disasters
6. **Celebration of progress**: Every completed step, lesson, and level is acknowledged. Small wins build confidence

### Anti-Patterns (What We Avoid)

- Never dump a wall of text before letting the student try something
- Never introduce jargon without an immediate plain-English explanation
- Never let a student feel lost without a clear "hint" or "help" path
- Never assume knowledge that hasn't been explicitly taught in a prior lesson
- Never make the student feel stupid for not knowing something

## Curriculum Structure

| Level | Title | Focus | Type |
|-------|-------|-------|------|
| 0 | Computers Are Not Magic | Files, folders, paths, what a terminal is | Conceptual + light interaction |
| 1 | Your First 30 Minutes in the Terminal | Navigation and file management | Hands-on in sandbox |
| 2 | Reading and Writing Files | File content manipulation, searching, piping | Hands-on in sandbox |
| 3 | Your Code Has a History | Git and GitHub fundamentals | Hands-on in sandbox |
| 4 | How Software Actually Works | Client/server, APIs, databases, the cloud | Conceptual + interactive diagrams |
| 5 | Building With Real Tools | Node.js, npm, building a real server | Hands-on on real machine |
| 6 | Claude Code — Your AI Pair Programmer | Using Claude Code to build projects | Hands-on on real machine |
| 7 | Junior Developer Patterns | Debugging, APIs, deployment, professional workflow | Hands-on on real machine |

### MVP Scope

Levels 0, 1, and 2 only. Approximately 30 lessons.

## Application Architecture

### Tech Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Framework | React + TypeScript | Component-based UI, type safety |
| Styling | Tailwind CSS | Rapid UI development, consistent design |
| Terminal UI | xterm.js | Industry-standard terminal emulator for the browser |
| File System | In-memory virtual FS (custom) | No server needed, instant feedback, safe sandbox |
| Command Parser | Custom (TypeScript) | Supports the exact commands needed per level, nothing more |
| Lesson Engine | Custom (TypeScript) | Loads lesson JSON, validates actions, tracks progress |
| Progress Storage | localStorage | No backend needed for MVP |
| Build Tool | Vite | Fast dev server, optimized builds |
| Hosting | Vercel or Render (static) | Free tier, zero config |

### Future Architecture (Post-MVP)

| Component | Technology | When |
|-----------|-----------|------|
| Terminal Backend | WebContainers (StackBlitz) | Level 3+ (git requires real shell) |
| User Accounts | Auth provider (Clerk/Auth0) | When progress sync across devices is needed |
| Database | PostgreSQL | When user accounts exist |
| API Server | Node.js / Express | When user accounts exist |
| Analytics | PostHog or similar | When understanding user drop-off matters |

## Application Layout

```
+-----------------------------------------------------------+
| Terminal Trainer              Level 1  ======----  60%    |
+----------+------------------------+---------------------+
|          |                        |                     |
| Sidebar  |    Main Content        |   Visual Explorer   |
|          |                        |                     |
| Level    |  Lesson title          |  File tree that     |
| overview |  Instruction text      |  mirrors terminal   |
| and      |                        |  state in real      |
| lesson   |  +------------------+  |  time               |
| list     |  | Terminal         |  |                     |
|          |  | ~/project $ _   |  |                     |
|          |  |                  |  |                     |
|          |  +------------------+  |                     |
|          |                        |                     |
|          |  Feedback/success msg  |                     |
|          |  [Hint] [Next]         |                     |
|          |                        |                     |
+----------+------------------------+---------------------+
| Command reference bar: pwd=location  ls=list  cd=move   |
+-----------------------------------------------------------+
```

### Responsive Design

- **Desktop (>1024px)**: Full 3-column layout as shown above
- **Tablet (768-1024px)**: 2 columns — sidebar collapses to hamburger menu, visual explorer moves below terminal
- **Mobile (<768px)**: Single column — lesson content + terminal stacked, sidebar is overlay menu. Visual explorer is a collapsible panel above terminal

## Core Components

### 1. Virtual File System

An in-memory file system that supports:
- Files with text content
- Nested directories
- Standard operations: create, read, update, delete, copy, move
- Path resolution (absolute and relative)
- Home directory (`~`)
- Current working directory tracking

Each lesson initializes the VFS with a predefined state.

### 2. Command Parser

Interprets user-typed commands and executes them against the VFS.

MVP command set:
- Navigation: `pwd`, `ls`, `ls -l`, `ls -a`, `cd`, `cd ..`, `cd ~`, `cd /path`
- File ops: `touch`, `mkdir`, `mkdir -p`, `rm`, `rm -r`, `cp`, `mv`
- Reading: `cat`, `head`, `head -n N`, `tail`, `tail -n N`
- Writing: `echo "text"`, `echo "text" > file`, `echo "text" >> file`
- Searching: `grep "pattern" file`, `grep -r "pattern" dir`, `grep -i`
- Utility: `clear`, `help`, `wc -l`, `history`
- Piping: `command | command` (at least `cat | grep`, `grep | wc`)

Error handling:
- Unrecognized command: "Command not found. Type 'help' to see available commands."
- Wrong arguments: Friendly error explaining what went wrong
- During guided steps: "That's not quite right. Try: [hint]"

### 3. Terminal UI (xterm.js)

- Styled to feel like a real terminal but less intimidating (slightly softer colors, readable font size)
- Command history (up/down arrows)
- Tab completion for file/folder names
- Copy/paste support
- Prompt shows current directory: `~/project $`

### 4. Visual File Explorer

- Tree view of the virtual file system
- Updates in real-time as the student types commands
- Highlights newly created/modified/deleted items with animation
- Shows file contents preview on hover or click
- Color-coded: folders in one color, files in another

### 5. Lesson Engine

Responsibilities:
- Load lesson definition (JSON)
- Initialize VFS to lesson's starting state
- Present steps sequentially
- Validate student actions (exact command match, output match, or FS state check)
- Provide hints on demand
- Track step completion
- Trigger success messages and milestone celebrations
- Handle free-form exploration between guided steps

Validation modes:
- `exactCommand`: Student must type this exact command
- `commandStartsWith`: Command must start with a prefix (allows variations)
- `outputContains`: Command output must contain a string
- `fileExists`: A specific file must exist after the command
- `fileContains`: A file must contain specific content
- `directoryExists`: A directory must exist
- `fsStateMatch`: Full file system state comparison

### 6. Progress Tracker

- Stored in localStorage
- Tracks: completed lessons, current lesson, current step, time spent per lesson
- Level completion percentage shown in header
- Lesson completion status shown in sidebar (not started / in progress / complete)
- Can be reset (start over)

## Lesson Data Format

```json
{
  "id": "1.3",
  "level": 1,
  "order": 3,
  "title": "Moving Into Folders",
  "subtitle": "cd — change directory",
  "estimatedMinutes": 5,
  "initialFileSystem": {
    "/home/user": {
      "documents": {
        "notes.txt": "My notes",
        "todo.txt": "Buy groceries"
      },
      "photos": {
        "vacation.jpg": "[image]",
        "profile.jpg": "[image]"
      },
      "projects": {
        "website": {
          "index.html": "<html>Hello</html>",
          "style.css": "body { margin: 0; }"
        }
      }
    }
  },
  "initialDirectory": "/home/user",
  "steps": [
    {
      "id": "1.3.1",
      "type": "instruction",
      "content": "You're in your home folder. Let's move into the 'documents' folder.",
      "prompt": "Type: cd documents",
      "hint": "cd = 'change directory'. Think of it as double-clicking a folder to open it.",
      "validation": {
        "type": "exactCommand",
        "value": "cd documents"
      },
      "onSuccess": {
        "message": "You're now inside the documents folder. Notice how the prompt changed.",
        "highlightExplorer": "/home/user/documents"
      }
    },
    {
      "id": "1.3.2",
      "type": "instruction",
      "content": "Now check what's in here.",
      "prompt": "What command lists files? Try it.",
      "hint": "Remember from the previous lesson? It's 'ls'.",
      "validation": {
        "type": "exactCommand",
        "value": "ls"
      },
      "onSuccess": {
        "message": "Two files: notes.txt and todo.txt. You navigated to a folder and looked inside — that's the core of terminal navigation."
      }
    }
  ],
  "freeExplorePrompt": "Try navigating around! Use cd, ls, and pwd to explore. When you're ready, click Next.",
  "milestone": null,
  "nextLesson": "1.4"
}
```

## Design Language

### Color Palette

- **Background**: Dark but not black. `#1a1b2e` (dark navy) — less intimidating than pure black
- **Terminal background**: `#0d1117` (GitHub dark)
- **Text**: `#e6edf3` (off-white, easier on eyes than pure white)
- **Accent / success**: `#58a6ff` (calm blue)
- **Success highlight**: `#3fb950` (green)
- **Warning**: `#d29922` (amber)
- **Error**: `#f85149` (soft red)
- **Sidebar**: `#161b22` (slightly lighter than terminal)

### Typography

- **UI text**: Inter or system font stack
- **Terminal text**: JetBrains Mono or Fira Code
- **Lesson content**: 16px minimum for readability

### Tone of Voice

- Conversational, not academic
- Encouraging but not patronizing
- "You just did X" rather than "Good job!"
- Technical terms always followed by plain-English translation on first use
- First person plural: "Let's try..." / "We can use..."

## Non-Functional Requirements

### Performance
- First meaningful paint: <2 seconds
- Terminal input response: <50ms (must feel instant)
- Lesson load time: <500ms

### Accessibility
- Keyboard-navigable (all interactions work without mouse)
- Screen reader support for lesson content (terminal itself is naturally text-based)
- High contrast between text and backgrounds
- Font size adjustable

### Browser Support
- Chrome, Firefox, Safari, Edge (latest 2 versions)
- No IE support
- Mobile browsers: functional but not primary target

## Future Considerations (Not In MVP)

- User accounts and cloud progress sync
- Leaderboards / community features
- Multiple language support (i18n)
- Content authoring tool (for creating lessons without editing JSON)
- Embedded video explanations for conceptual lessons
- AI-powered hint system (Claude generates contextual hints)
- Lesson branching (different paths based on student performance)
- Platform-specific tracks (Mac vs Windows diverge at Level 5+)
