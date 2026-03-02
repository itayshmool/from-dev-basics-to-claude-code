# Level 3 Spec: "Your Code Has a History"

## Overview

| Field | Value |
|-------|-------|
| Level | 3 |
| Title | Your Code Has a History |
| Subtitle | Git and GitHub — never lose your work again |
| Lessons | 16 |
| Type | Hands-on in sandbox terminal |
| Prerequisite | Level 2 |
| MVP | No (requires real shell or WebContainers for git) |

## Learning Objectives

By the end of Level 3, the student can:

1. Explain what version control is and why it exists
2. Initialize a git repository with `git init`
3. Check the status of their repo with `git status`
4. Stage changes with `git add`
5. Commit changes with `git commit -m "message"`
6. View commit history with `git log`
7. See what changed with `git diff`
8. Undo changes to a file with `git checkout`
9. Create a GitHub account and connect it to git
10. Push code to GitHub with `git push`
11. Clone a project from GitHub with `git clone`
12. Pull latest changes with `git pull`
13. Create and switch branches with `git branch` and `git checkout -b`
14. Merge branches with `git merge`
15. Write meaningful commit messages
16. Use the basic git workflow: edit → stage → commit → push

## Pedagogical Approach

Git is notoriously confusing for beginners. Our approach:

1. **Start with the "why"**: Before any commands, explain the problem git solves (losing work, collaborating, experimenting safely)
2. **One concept at a time**: Each lesson introduces exactly one git concept
3. **Visual git graph**: A new panel shows the commit history as a visual timeline that updates in real-time
4. **Analogy-heavy**: Every git concept maps to a familiar real-world concept
5. **Mistakes are planned**: We intentionally create scenarios where git saves the student from losing work

### Core Analogies

| Git Concept | Analogy |
|-------------|---------|
| Repository | A project folder that remembers its history |
| Commit | A save point in a video game |
| Staging area | Packing a box before shipping |
| Branch | Making a copy to experiment on |
| Merge | Combining the experiment back into the original |
| Push | Uploading your save file to the cloud |
| Pull | Downloading the latest save file |
| Clone | Downloading someone else's project |

## Lessons

---

### Lesson 3.1: Why Version Control?

**Type**: Conceptual (no terminal)

**Content**:

"Imagine you're writing an essay. You save it as `essay.docx`. Then you make changes and want to keep the old version, so you save `essay_v2.docx`. Then `essay_final.docx`. Then `essay_final_FINAL.docx`. Then `essay_REALLY_final.docx`.

Sound familiar?

Now imagine working on a project with 100 files and 3 other people. Version control solves this. It tracks every change to every file, who changed it, when, and why. You can rewind to any point in time.

Git is the most popular version control system in the world. Every tech company uses it. After this level, you will too."

**Interactive Element**: Show a timeline visualization of a project evolving — files being added, modified, deleted — with the ability to "rewind" to any point.

---

### Lesson 3.2: Starting a Repository (`git init`)

**Initial FS**:
```
/home/user/my-project/
  index.html: "<html><body><h1>Hello</h1></body></html>"
  style.css: "body { font-family: sans-serif; }"
```

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Turn this folder into a git repository: `git init`." | `git init` | "Done. Git is now watching this folder. A hidden `.git` folder was created — that's where git stores everything." |
| 2 | "Try `ls -a` to see the hidden .git folder." | `ls -a` | "See `.git`? Never touch that folder directly. Git manages it for you." |

---

### Lesson 3.3: Checking Status (`git status`)

**Continues from 3.2**

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Ask git what's going on: `git status`." | `git status` | "Git sees two 'untracked files' — files it knows about but isn't tracking yet. Red means 'not staged'." |

**Key Point**: "`git status` is your most-used git command. Run it constantly. It always tells you what's happening."

---

### Lesson 3.4: Staging Changes (`git add`)

**Continues from 3.3**

**Instruction**: "Before git can save your work, you need to tell it which changes to include. This is called 'staging'."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Stage index.html: `git add index.html`." | `git add index.html` | "index.html is now staged (ready to be saved)." |
| 2 | "Check status again." | `git status` | "index.html is green (staged). style.css is still red (not staged)." |
| 3 | "Stage everything at once: `git add .`" | `git add .` | "The `.` means 'everything in this folder'. Both files are now staged." |

**Analogy Box**: "Think of staging like packing a box. You choose what goes in (git add), then you seal and label it (git commit). You can pack items one by one or throw everything in."

---

### Lesson 3.5: Saving a Snapshot (`git commit`)

**Continues from 3.4**

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Save your staged changes: `git commit -m \"Initial commit: add HTML and CSS\"`." | `git commit -m "Initial commit: add HTML and CSS"` | "Your first commit! Git saved a snapshot of your project at this exact moment." |
| 2 | "Check status." | `git status` | "'Nothing to commit, working tree clean.' Everything is saved." |

**Visual**: The git timeline panel shows the first commit as a dot on a line.

---

### Lesson 3.6: Making More Changes

**Continues from 3.5**

**Instruction**: "Let's make some changes and commit again to see how history builds."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Edit index.html — add a paragraph." | `echo "<p>Welcome to my site</p>" >> index.html` | "File modified." |
| 2 | "Create a new file." | `touch app.js` | "New file created." |
| 3 | "Check status." | `git status` | "Red text: one modified file, one new untracked file. Git notices everything." |
| 4 | "Stage and commit." | `git add .` | "Staged." |
| 5 | "Commit with a meaningful message." | `git commit -m "Add welcome paragraph and app.js"` | "Second commit. Your timeline now has two points." |

**Visual**: Timeline shows two commits.

---

### Lesson 3.7: Viewing History (`git log`)

**Continues from 3.6**

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "View your project's history: `git log`." | `git log` | "Two commits, newest first. Each has: a unique ID (hash), author, date, and your message." |
| 2 | "Compact view: `git log --oneline`." | `git log --oneline` | "Shorter. Just the hash and message. This is what you'll use most." |

**Key Point**: "Those commit messages matter. 'fix stuff' tells you nothing in 6 months. 'Fix login button not responding on mobile' tells you exactly what happened."

---

### Lesson 3.8: Seeing What Changed (`git diff`)

**Initial FS**: Project with 2 commits. Student modifies a file.

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Edit style.css — change the font." | `echo "body { font-family: monospace; }" > style.css` | "File modified." |
| 2 | "See exactly what changed: `git diff`." | `git diff` | "Red lines (with -) show what was removed. Green lines (with +) show what was added. This is how code review works." |

---

### Lesson 3.9: Undoing Changes

**Instruction**: "You made a change you don't like. Git lets you go back."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "You don't like the font change. Undo it: `git checkout -- style.css`." | `git checkout -- style.css` | "The file is back to how it was at the last commit. Your change is gone — git restored the saved version." |
| 2 | "Verify." | `cat style.css` | "Back to sans-serif. This is the 'undo' button you've been waiting for." |

**Key Insight**: "This is why git matters. You can experiment freely because you can always go back. No more fear of breaking things."

---

### Lesson 3.10: What Is GitHub?

**Type**: Conceptual

**Content**: "Git lives on your computer. GitHub is a website that stores your git repositories online. Think of it as Google Drive for code. It lets you:
- Back up your code (if your laptop dies, your code survives)
- Share code with others
- Collaborate on projects
- Show your work to employers"

**Interactive**: Screenshot walkthrough of GitHub.com — what a repository looks like, what files look like, what commits look like.

---

### Lesson 3.11: Pushing to GitHub (`git remote` + `git push`)

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Connect your local repo to GitHub: `git remote add origin https://github.com/you/my-project.git`." | `git remote add origin ...` | "Your local repo now knows where to send code. 'origin' is the conventional name for the main remote." |
| 2 | "Upload your commits: `git push -u origin main`." | `git push -u origin main` | "Your code is now on GitHub! Anyone with the URL can see it." |

---

### Lesson 3.12: Downloading a Project (`git clone`)

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Download a project from GitHub: `git clone https://github.com/example/sample-project.git`." | `git clone ...` | "The entire project — all files and all history — is now on your computer." |
| 2 | "Move into it and look around." | `cd sample-project && ls` | "All the files are here, and git is already set up. `git log` will show the full history." |

---

### Lesson 3.13: Getting Latest Changes (`git pull`)

**Instruction**: "When other people (or you from another computer) push changes, you need to download them."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Get the latest version: `git pull`." | `git pull` | "Your local copy is now up to date with GitHub. Do this before starting work each time." |

---

### Lesson 3.14: Branches — Working in Parallel

**Type**: Conceptual + hands-on

**Instruction**: "Branches let you work on something new without affecting the main project. Think of it as making a copy to experiment on."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "See your current branch: `git branch`." | `git branch` | "You're on `main` — the primary branch." |
| 2 | "Create a new branch and switch to it: `git checkout -b add-nav`." | `git checkout -b add-nav` | "You're now on a new branch called 'add-nav'. Changes here won't affect main." |
| 3 | "Make a change and commit." | (student creates file and commits) | "This commit only exists on the add-nav branch." |

**Visual**: Git timeline shows two branches splitting from a point.

---

### Lesson 3.15: Merging Branches

**Continues from 3.14**

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Switch back to main: `git checkout main`." | `git checkout main` | "Back on main. Notice your new file is gone — it only exists on add-nav." |
| 2 | "Merge add-nav into main: `git merge add-nav`." | `git merge add-nav` | "The changes from add-nav are now in main. Both branches are combined." |

**Visual**: Git timeline shows the branches merging back together.

---

### Lesson 3.16: The Full Workflow

**Challenge**: Complete the entire git workflow independently:

1. Create a new project folder
2. Initialize git
3. Create files, make initial commit
4. Create a feature branch
5. Make changes on the branch, commit
6. Merge back to main
7. Push to GitHub

**On Completion**:
```
Level 3 Complete: Your Code Has a History

You now know:
  git init          — start tracking
  git status        — what's changed?
  git add           — stage changes
  git commit        — save a snapshot
  git log           — view history
  git diff          — see exact changes
  git checkout      — undo or switch branches
  git push / pull   — sync with GitHub
  git clone         — download a project
  git branch        — work in parallel
  git merge         — combine branches

The key insight: You never have to be afraid of breaking things.
Git is your time machine.
```

## Technical Notes

### Sandbox Requirements

This level requires a **real git installation**, which means:
- **Option A**: WebContainers (can run git in browser)
- **Option B**: Guide student to use their real terminal (with the app as a side-by-side guide)
- **Option C**: Server-side Docker container with git installed

For post-MVP, Option A (WebContainers) is recommended.

### New Visual Component: Git Timeline

A horizontal or vertical timeline showing:
- Commits as dots/nodes
- Branch splits and merges
- Current branch highlighted
- Clickable commits showing changed files
- Updates in real-time as student types git commands
