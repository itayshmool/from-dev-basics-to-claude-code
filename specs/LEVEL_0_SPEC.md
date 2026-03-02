# Level 0 Spec: "Computers Are Not Magic"

## Overview

| Field | Value |
|-------|-------|
| Level | 0 |
| Title | Computers Are Not Magic |
| Subtitle | Files, folders, paths, and what a terminal actually is |
| Lessons | 6 |
| Type | Conceptual with light interaction |
| Prerequisite | None |
| MVP | Yes |

## Learning Objectives

By the end of Level 0, the student can:

1. Explain what a file is and give examples of file types
2. Explain what a folder (directory) is and how folders nest inside each other
3. Read and interpret a file path like `/Users/sara/Documents/resume.pdf`
4. Identify the file name, extension, and parent folder from any path
5. Explain in simple terms what a program is
6. Explain what a terminal is and why it exists
7. Feel confident enough to open a terminal without anxiety

## Pedagogical Approach

This level is primarily **conceptual**. The student is not yet typing commands. Instead, they interact through:

- Multiple-choice questions
- Drag-and-drop matching (path components to meanings)
- Fill-in-the-blank for paths
- A "preview" of the terminal (read-only, showing what commands look like)
- Interactive file tree visualizations they can click to explore

The goal is to build a **mental model** before introducing any commands.

## Lessons

---

### Lesson 0.1: What Is a File?

**Concept**: A file is a container for information stored on your computer.

**Analogy**: A file is like a single document in a filing cabinet. It has a name, it contains something (text, an image, music), and it lives somewhere specific.

**Key Points**:
- Everything on your computer is a file: photos, documents, songs, apps
- Files have names: `photo.jpg`, `resume.pdf`, `notes.txt`
- Files have types (extensions): the part after the dot tells the computer what kind of file it is
- Common extensions:
  - `.txt` = plain text
  - `.pdf` = document
  - `.jpg` / `.png` = image
  - `.mp3` = audio
  - `.html` = web page
  - `.js` = JavaScript code
  - `.css` = styling for web pages

**Interactive Element**: Show a visual grid of file icons. Student clicks each one and sees its name, type, and what's inside (preview).

**Validation**:
```
Q: What type of file is "birthday.jpg"?
A: An image

Q: What is the extension of "report.pdf"?
A: .pdf

Q: If you see a file ending in .html, what does it contain?
A: A web page
```

---

### Lesson 0.2: What Is a Folder?

**Concept**: A folder (also called a directory) is a container that holds files and other folders.

**Analogy**: A folder is like a drawer in a filing cabinet. You can put documents (files) in it, and you can put smaller folders inside it — folders within folders within folders.

**Key Points**:
- Folders organize files, just like physical folders organize papers
- Folders can contain files AND other folders (nesting)
- Every computer has a similar basic structure:
  - A home folder for each user
  - Desktop, Documents, Downloads inside the home folder
  - You can create your own folders anywhere
- Developers organize their code in folders called "projects"

**Interactive Element**: Animated file tree that the student can expand/collapse. Shows a typical computer structure:
```
/Users/
  sara/
    Desktop/
      notes.txt
      screenshot.png
    Documents/
      resume.pdf
      cover-letter.pdf
    Downloads/
      app-installer.dmg
    projects/
      my-website/
        index.html
        style.css
```

Student clicks folders to expand them. A counter shows "3 files in this folder" etc.

**Validation**:
```
Q: How many files are in Sara's Desktop folder?
A: 2

Q: What folder is resume.pdf inside?
A: Documents

Q: Can a folder contain other folders?
A: Yes
```

---

### Lesson 0.3: What Is a File Path?

**Concept**: A path is the address of a file or folder on your computer. It tells you exactly where something is.

**Analogy**: A file path is like a street address. Just like "123 Oak Street, Apartment 4B" tells you exactly where someone lives, `/Users/sara/Documents/resume.pdf` tells you exactly where a file lives.

**Key Points**:
- A path uses slashes `/` to separate folder names (Mac/Linux) or backslashes `\` on Windows
- The path reads left to right, from the outermost folder to the file
- Breaking down `/Users/sara/Documents/resume.pdf`:
  - `Users` → the Users folder (contains all user accounts)
  - `sara` → Sara's home folder
  - `Documents` → her Documents folder
  - `resume.pdf` → the actual file
- Special paths:
  - `/` → the very top (root) of the file system
  - `~` → shortcut for your home folder
  - `.` → the current folder you're in
  - `..` → the folder one level up (parent)

**Interactive Element**: An animated path builder. Show a file tree on the left. When the student clicks through folders to reach a file, the path builds character by character at the top: `/` → `/Users/` → `/Users/sara/` → `/Users/sara/Documents/` → `/Users/sara/Documents/resume.pdf`

**Validation**:
```
Given the path: /Users/mike/photos/vacation/beach.jpg

Q: What is the file name?
A: beach.jpg

Q: What folder is it in?
A: vacation

Q: What is the full path to the "vacation" folder?
A: /Users/mike/photos/vacation

Q: If mike is in his home folder, what does ~ refer to?
A: /Users/mike
```

---

### Lesson 0.4: File Types and What's Inside

**Concept**: The file extension tells the computer (and you) what kind of content is inside and what program should open it.

**Analogy**: File extensions are like labels on boxes. A box labeled "FRAGILE — GLASS" tells you what's inside and how to handle it. A file ending in `.jpg` tells the computer "this is an image, open it with an image viewer."

**Key Points**:
- The computer uses the extension to decide what to do with a file
- Common categories:
  - **Text files** (`.txt`, `.md`): Plain text, readable by any text editor
  - **Documents** (`.pdf`, `.docx`): Formatted documents
  - **Images** (`.jpg`, `.png`, `.gif`, `.svg`): Visual content
  - **Audio/Video** (`.mp3`, `.mp4`, `.wav`): Media
  - **Code files** (`.html`, `.css`, `.js`, `.py`, `.ts`): Instructions for computers
  - **Data files** (`.json`, `.csv`, `.xml`): Structured data
  - **Config files** (`.env`, `.yml`, `.toml`): Settings
- Code files are just text files with a specific extension
- You can open any code file in a text editor and read it — it's not encrypted or special

**Interactive Element**: A matching game. Show file names on the left, categories on the right. Student drags to match:
- `photo.png` → Image
- `app.js` → Code
- `data.json` → Data
- `readme.md` → Text
- `config.yml` → Config

**Validation**:
```
Q: Your friend sends you "styles.css". What does this file contain?
A: Styling code for a web page

Q: Can you open a .js file in a regular text editor?
A: Yes — code files are just text files

Q: What's the difference between notes.txt and notes.md?
A: Both are text, but .md (Markdown) supports formatting like bold and headers
```

---

### Lesson 0.5: What Is a Program?

**Concept**: A program is a file that contains instructions the computer can execute (run).

**Analogy**: A program is like a recipe. The recipe (code) sits in a file. When you "run" it, the computer follows the instructions step by step, just like a chef follows a recipe.

**Key Points**:
- Every app on your computer is a program: Chrome, Spotify, Calculator
- A program starts as code (text in a file) written by a developer
- When you "run" a program, the computer reads the instructions and executes them
- Simple programs might be a single file; complex programs (like Chrome) are thousands of files
- When you double-click an app icon, you're telling the computer: "read this program's files and execute the instructions"
- The terminal lets you run programs by typing their name instead of double-clicking

**Interactive Element**: Show a simple 5-line program (pseudocode, not real code):
```
1. Ask the user for their name
2. Save their answer
3. Display "Hello, [their name]!"
4. Wait 2 seconds
5. Display "Goodbye!"
```
Then show it "running" — an animation that goes through each line, highlights it, and shows the result. The student types their name and sees the program execute.

**Validation**:
```
Q: What is a program?
A: A file containing instructions that the computer can execute

Q: When you double-click the Chrome icon on your desktop, what happens?
A: The computer reads Chrome's program files and runs the instructions

Q: Is a program a type of file?
A: Yes — programs are files with executable instructions
```

---

### Lesson 0.6: What Is a Terminal?

**Concept**: A terminal is a text-based way to interact with your computer. Instead of clicking icons and menus, you type commands.

**Analogy**: Think of your computer as a restaurant. The graphical interface (Finder, Desktop) is like dining in — you look at the menu, point at what you want, a waiter brings it. The terminal is like calling the kitchen directly — you tell the chef exactly what you want using specific words. Same food, different way of ordering.

**Key Points**:
- The terminal does the same things as your graphical interface, just with typing
- Everything you can do by clicking, you can do by typing a command
- Why developers use the terminal:
  - It's faster for many tasks (once you know the commands)
  - Some tools only work in the terminal
  - You can automate repetitive tasks
  - You can combine commands in powerful ways
  - It works the same on every computer
- Terminal names:
  - Mac: Terminal.app (built-in), iTerm2 (popular alternative)
  - Windows: PowerShell, Command Prompt, or Windows Terminal
  - Linux: Various terminal emulators
- What you'll see when you open it:
  - A mostly blank screen with a "prompt" — a line that ends with `$` or `>`
  - The prompt is the terminal waiting for you to type something
  - You type a command, press Enter, and the computer responds

**Interactive Element**: Read-only terminal preview. Show a terminal with 3 pre-typed example commands and their output:
```
$ pwd
/Users/sara

$ ls
Desktop  Documents  Downloads  projects

$ cd projects
$
```
Each command highlights in sequence with an annotation explaining what it does:
- `pwd` → "Shows where you are"
- `ls` → "Lists what's in the current folder"
- `cd projects` → "Moves into the projects folder"

Final message: "In the next level, you'll type these commands yourself."

**Validation**:
```
Q: What is a terminal?
A: A text-based interface where you type commands to interact with your computer

Q: Can you do the same things in the terminal as in Finder/Explorer?
A: Yes — it's a different way to do the same things

Q: What does the $ sign in a terminal mean?
A: It's the prompt — the terminal is waiting for you to type a command

Q: Name one reason developers prefer the terminal
A: (Any of: faster, automation, some tools only work there, works the same everywhere)
```

---

## Level 0 Milestone

After completing all 6 lessons, the student sees:

```
Level 0 Complete!

You now understand:
  - Files are containers for information
  - Folders organize files (and can contain other folders)
  - Paths are addresses that tell you exactly where a file is
  - File extensions tell the computer what kind of file it is
  - Programs are files with instructions the computer runs
  - The terminal is a text-based way to control your computer

Next up: Level 1 — Your First 30 Minutes in the Terminal
You'll type real commands and build things.

[Start Level 1 ->]
```

## Technical Notes

### Implementation Differences from Other Levels

- Level 0 does NOT use the full terminal component
- Interaction is through quiz components, drag-and-drop, and interactive visualizations
- The terminal appears only in Lesson 0.6 as a read-only preview
- The visual file explorer is used extensively as a teaching tool (clickable, expandable)

### Components Needed

- `Quiz`: Multiple choice question component
- `DragMatch`: Drag and drop matching game
- `FillInBlank`: Text input with validation
- `InteractiveFileTree`: Clickable, expandable file tree visualization
- `PathBuilder`: Animated path construction visualization
- `TerminalPreview`: Read-only terminal with annotated commands
- `ProgramSimulator`: Step-through animation of pseudocode execution
