# Level 1 Spec: "Your First 30 Minutes in the Terminal"

## Overview

| Field | Value |
|-------|-------|
| Level | 1 |
| Title | Your First 30 Minutes in the Terminal |
| Subtitle | Navigate, create, and manage files like a developer |
| Lessons | 12 |
| Type | Hands-on in sandbox terminal |
| Prerequisite | Level 0 |
| MVP | Yes |

## Learning Objectives

By the end of Level 1, the student can:

1. Open a terminal prompt and type commands without hesitation
2. Use `pwd` to check their current location at any time
3. Use `ls` to list folder contents (including `ls -l` and `ls -a`)
4. Use `cd` to navigate into folders, up to parent folders, and back to home
5. Create files with `touch` and folders with `mkdir`
6. Delete files with `rm` and folders with `rm -r`
7. Copy files with `cp` and move/rename files with `mv`
8. Build a complete project folder structure from scratch
9. Recover when "lost" in the filesystem (pwd + cd ~ pattern)
10. Explain what each command does in plain English

## Pedagogical Approach

This is the first fully hands-on level. Every lesson follows this pattern:

1. **Brief explanation** (2-3 sentences max, with analogy)
2. **Guided step** ("Type this command: ___")
3. **Observe result** (terminal output + visual explorer update)
4. **Explanation of what happened** (1-2 sentences)
5. **Try it yourself** (similar but slightly different task, hints available)
6. **Free explore** (optional: try whatever you want before moving on)

### Key Design Decisions

- The terminal starts in `/home/user` — a simulated home directory
- Each lesson pre-populates the virtual file system with relevant files/folders
- The visual file explorer is always visible and updates in real-time
- Every command the student types is reflected in the visual explorer immediately
- Wrong commands get friendly corrections, never just "command not found"
- The command reference bar at the bottom shows commands learned so far

## Lessons

---

### Lesson 1.1: Where Am I? (`pwd`)

**Initial FS**:
```
/home/user/
  documents/
    notes.txt
  photos/
    vacation.jpg
  projects/
    website/
      index.html
```

**Initial directory**: `/home/user`

**Instruction**: "Your terminal is open. The first thing to do in any terminal: find out where you are."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Type `pwd` and press Enter. pwd = 'print working directory' — it shows your current location." | `pwd` | "You're at `/home/user` — this is your home folder. Think of it as the 'You Are Here' dot on a mall map." |
| 2 | "You'll use `pwd` whenever you feel lost. It's your compass. Try it again just to build the habit." | `pwd` | "Same answer: `/home/user`. You haven't moved. `pwd` never changes anything — it just tells you where you are." |

**Command Reference Added**: `pwd` — show current location

---

### Lesson 1.2: What's Here? (`ls`)

**Initial FS**: Same as 1.1

**Initial directory**: `/home/user`

**Instruction**: "Now that you know where you are, let's see what's around you."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Type `ls` to list everything in your current folder. ls = 'list'." | `ls` | "Three folders: documents, photos, projects. This is exactly what you'd see if you opened this folder in Finder or File Explorer." |
| 2 | "Want more detail? Try `ls -l` (that's a lowercase L, for 'long format')." | `ls -l` | "Now you see more info: file sizes, dates, and whether something is a file or folder. The 'd' at the start means directory (folder)." |
| 3 | "Some files are hidden (their names start with a dot). Try `ls -a` to see everything." | `ls -a` | "See `.` and `..`? Those are special: `.` means 'this folder' and `..` means 'the folder above'. We'll use `..` soon." |

**Command Reference Added**: `ls` — list files, `ls -l` — detailed list, `ls -a` — show hidden

---

### Lesson 1.3: Moving Into Folders (`cd`)

**Initial FS**: Same as 1.1

**Initial directory**: `/home/user`

**Instruction**: "You can see three folders. Let's go inside one."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Move into the `documents` folder. Type `cd documents`." | `cd documents` | "Notice your prompt changed to show you're now in ~/documents. `cd` = 'change directory'." |
| 2 | "Check what's here." | `ls` | "One file: notes.txt. You navigated to a folder and looked inside — two essential skills." |
| 3 | "Confirm your location." | `pwd` | "`/home/user/documents` — exactly where you'd expect." |

**Visual Explorer**: Highlights `/home/user/documents` as the active directory.

**Command Reference Added**: `cd folder` — move into a folder

---

### Lesson 1.4: Going Back Up (`cd ..`)

**Initial FS**: Same as 1.1

**Initial directory**: `/home/user/documents` (continues from 1.3)

**Instruction**: "You're inside documents. How do you go back up to your home folder?"

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Type `cd ..` to go up one folder. `..` always means 'parent folder'." | `cd ..` | "You're back in `/home/user`. `cd ..` is like clicking the back button." |
| 2 | "Now navigate into `projects`, then into `website`." | `cd projects` | "Good, you're in projects." |
| 3 | "Keep going — into `website`." | `cd website` | "You're at `/home/user/projects/website`." |
| 4 | "Go up two levels to get back home. You can chain it: `cd ../..`" | `cd ../..` | "Back to `/home/user`. Each `..` goes up one level, so `../..` goes up two." |

**Command Reference Added**: `cd ..` — go up one folder, `cd ../..` — go up two

---

### Lesson 1.5: Going Home (`cd ~`)

**Initial FS**: Same as 1.1

**Initial directory**: `/home/user/projects/website`

**Instruction**: "Sometimes you're deep in a folder tree and just want to go home. There's a shortcut."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Check where you are first." | `pwd` | "`/home/user/projects/website` — a few levels deep." |
| 2 | "Type `cd ~` to jump straight home. `~` always means your home folder." | `cd ~` | "You're at `/home/user` — no matter how deep you were, `~` takes you home." |
| 3 | "You can also just type `cd` with nothing after it. Same result." | `cd` | "Also home. Both `cd` and `cd ~` are your 'panic button' when you feel lost." |

**Survival Tip Displayed**: "Lost? Type `pwd` to see where you are. Type `cd ~` to go home. You can always start over."

**Command Reference Added**: `cd ~` or `cd` — go to home folder

---

### Lesson 1.6: Creating Folders (`mkdir`)

**Initial FS**:
```
/home/user/
  (empty)
```

**Initial directory**: `/home/user`

**Instruction**: "Let's build something. First, we need a folder for our project."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Create a folder called `my-project`. Type `mkdir my-project`." | `mkdir my-project` | "Folder created! Check the Visual Explorer — you can see it appeared." |
| 2 | "Verify it's there." | `ls` | "There it is: `my-project`. `mkdir` = 'make directory'." |
| 3 | "Move into your new folder." | `cd my-project` | "You're now inside your project folder." |
| 4 | "Create two folders inside: `css` and `js`." | `mkdir css` | "First one done." |
| 5 | "Now the second one." | `mkdir js` | "Both created. Check `ls` to see them." |

**Command Reference Added**: `mkdir name` — create a folder

---

### Lesson 1.7: Creating Files (`touch`)

**Initial FS**: Continues from 1.6

**Initial directory**: `/home/user/my-project`

**Instruction**: "Folders are created. Now let's add some files."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Create a file called `index.html`. Type `touch index.html`." | `touch index.html` | "File created! It's empty for now — `touch` creates a blank file." |
| 2 | "Check it's there." | `ls` | "You see: css, js, and index.html. Files and folders together." |
| 3 | "Create `style.css` inside the `css` folder. You can do it in one go: `touch css/style.css`." | `touch css/style.css` | "Created! You didn't even need to `cd` into the folder first. You can use paths with any command." |
| 4 | "Create `app.js` inside the `js` folder." | `touch js/app.js` | "Your project is taking shape. Look at the Visual Explorer — it matches what a real web project looks like." |

**Command Reference Added**: `touch name` — create an empty file

---

### Lesson 1.8: Deleting Files (`rm`)

**Initial FS**:
```
/home/user/
  my-project/
    index.html
    old-notes.txt
    temp.txt
    css/
      style.css
    js/
      app.js
```

**Initial directory**: `/home/user/my-project`

**Instruction**: "Sometimes you need to clean up. Let's delete some files we don't need."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "List the files first." | `ls` | "You see index.html, old-notes.txt, temp.txt, css/, js/." |
| 2 | "Delete `temp.txt`. Type `rm temp.txt`." | `rm temp.txt` | "Gone. `rm` = 'remove'. No trash can, no undo — it's just deleted." |
| 3 | "Delete `old-notes.txt` too." | `rm old-notes.txt` | "Cleaned up. `ls` to confirm." |
| 4 | "Verify." | `ls` | "Just index.html, css/, and js/. Clean." |

**Warning Box**: "`rm` is permanent. There's no recycling bin in the terminal. In Level 3, you'll learn git, which gives you the power to undo — but for now, be intentional with `rm`."

**Command Reference Added**: `rm file` — permanently delete a file

---

### Lesson 1.9: Deleting Folders (`rm -r`)

**Initial FS**:
```
/home/user/
  my-project/
    index.html
    css/
      style.css
    js/
      app.js
    old-stuff/
      draft1.txt
      draft2.txt
```

**Initial directory**: `/home/user/my-project`

**Instruction**: "Deleting folders is slightly different — you need to tell `rm` to go 'recursive'."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Try deleting `old-stuff` the same way as a file: `rm old-stuff`." | `rm old-stuff` | "(Error) 'rm: old-stuff: is a directory'. Regular `rm` only works on files." |
| 2 | "To delete a folder and everything inside it, add `-r` (recursive): `rm -r old-stuff`." | `rm -r old-stuff` | "The folder and all its contents are gone. `-r` means 'go through everything inside, then delete the folder too'." |

**Warning Box**: "`rm -r` deletes a folder and EVERYTHING inside it. Always double-check the folder name before pressing Enter."

**Command Reference Added**: `rm -r folder` — delete a folder and its contents

---

### Lesson 1.10: Copying Files (`cp`)

**Initial FS**:
```
/home/user/
  my-project/
    index.html
    about.html
    css/
    backup/
```

**Initial directory**: `/home/user/my-project`

**Instruction**: "Sometimes you want to copy a file — keep the original and make a duplicate."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Copy `index.html` to the `backup` folder: `cp index.html backup/index.html`." | `cp index.html backup/index.html` | "Copied! The original is still here, and a copy is in backup/." |
| 2 | "You can also copy and rename at the same time: `cp about.html backup/about-backup.html`." | `cp about.html backup/about-backup.html` | "The copy has a different name. `cp` always takes two arguments: source and destination." |
| 3 | "Verify both copies are in backup." | `ls backup` | "Both files are there. Originals untouched." |

**Command Reference Added**: `cp source destination` — copy a file

---

### Lesson 1.11: Moving and Renaming (`mv`)

**Initial FS**:
```
/home/user/
  my-project/
    idnex.html
    style.css
    js/
```

**Initial directory**: `/home/user/my-project`

**Instruction**: "`mv` does two things: move a file to a different location, or rename it. Same command, different use."

**Steps**:

| Step | Instruction | Expected Command | Success Message |
|------|------------|-----------------|-----------------|
| 1 | "Oops — `idnex.html` is a typo. Let's rename it: `mv idnex.html index.html`." | `mv idnex.html index.html` | "Renamed! When the source and destination are in the same folder, `mv` acts as rename." |
| 2 | "`style.css` should be in a `css` folder. Let's create it and move the file." | `mkdir css` | "Folder created." |
| 3 | "Now move the file: `mv style.css css/style.css`." | `mv style.css css/style.css` | "Moved! Unlike `cp`, the original is gone — it's been relocated. Check the Visual Explorer." |
| 4 | "Verify." | `ls` | "index.html, css/, js/. The style.css is now inside css/." |

**Command Reference Added**: `mv source destination` — move or rename a file

---

### Lesson 1.12: Putting It All Together

**Initial FS**:
```
/home/user/
  (empty)
```

**Initial directory**: `/home/user`

**Instruction**: "Challenge time. Build a complete project structure using everything you've learned. No step-by-step guidance — just the goal and your skills."

**Target Structure**:
```
my-portfolio/
  index.html
  about.html
  contact.html
  assets/
    css/
      style.css
      responsive.css
    js/
      app.js
    images/
```

**Validation**: File system state match — all files and folders must exist.

**Hints Available** (on demand):
1. "Start by creating the top-level folder and cd into it"
2. "Create all three HTML files with `touch`"
3. "Create nested folders with `mkdir -p assets/css` — the `-p` flag creates parent folders too"
4. "Don't forget the empty `images` folder"

**On Completion**:
```
You just built a project structure from scratch using only the terminal.

Commands you now know:
  pwd         — where am I?
  ls          — what's here?
  cd          — move to a folder
  cd ..       — go up one level
  cd ~        — go home
  mkdir       — create a folder
  touch       — create a file
  rm          — delete a file
  rm -r       — delete a folder
  cp          — copy a file
  mv          — move or rename

That's 11 commands. Professional developers use these every single day.
```

---

## Level 1 Milestone

```
Level 1 Complete: Your First 30 Minutes in the Terminal

You can now:
  - Navigate anywhere on a computer using the terminal
  - Create files and folders
  - Move, copy, rename, and delete things
  - Build a project structure from scratch

The key insight: The terminal does the same things as Finder or Explorer,
just with typing instead of clicking. And once you know the commands,
it's actually faster.

Next up: Level 2 — Reading and Writing Files
You'll learn to look inside files, search for text, and chain
commands together.

[Start Level 2 ->]
```

## Technical Notes

### New Components vs Level 0

- This is the first level using the **full terminal** (xterm.js + command parser)
- The **Visual File Explorer** is critical — it provides visual confirmation of every action
- The **Command Reference Bar** at the bottom grows as new commands are introduced
- Free exploration mode is available after every lesson

### Command Parser Requirements for This Level

Must support:
- `pwd` — return current directory path
- `ls`, `ls -l`, `ls -a`, `ls -la`, `ls path` — list with options
- `cd path`, `cd ..`, `cd ../..`, `cd ~`, `cd` (no args) — navigation
- `mkdir name`, `mkdir -p nested/path` — directory creation
- `touch name`, `touch path/name` — file creation
- `rm file` — file deletion (error on directories)
- `rm -r dir` — recursive directory deletion
- `cp source dest` — file copy
- `mv source dest` — move/rename
- `clear` — clear terminal screen
- `help` — show available commands

### Error Messages (Friendly)

| Scenario | Message |
|----------|---------|
| Unknown command | `Command not found: "xyz". Type 'help' to see available commands.` |
| `cd` to non-existent folder | `No such directory: "xyz". Use 'ls' to see what's in the current folder.` |
| `rm` on a directory | `Can't remove "xyz": it's a folder. Use 'rm -r xyz' to delete folders.` |
| `cd` to a file | `"xyz" is a file, not a folder. You can only cd into folders.` |
| `mkdir` existing folder | `Folder "xyz" already exists.` |
| `touch` in non-existent path | `Can't create file: the folder "xyz" doesn't exist. Create it first with mkdir.` |
