# Level 5 Spec: "Building With Real Tools"

## Overview

| Field | Value |
|-------|-------|
| Level | 5 |
| Title | Building With Real Tools |
| Subtitle | Install Node.js, run code, build a real server |
| Lessons | 15 |
| Type | Hands-on on student's real machine |
| Prerequisite | Level 4 |
| MVP | No |

## Learning Objectives

By the end of Level 5, the student can:

1. Install Node.js and npm on their computer (Mac or Windows)
2. Verify installations by checking versions
3. Use the Node.js REPL to run JavaScript interactively
4. Create and run a JavaScript file
5. Understand what npm is and why it exists
6. Initialize a project with `npm init`
7. Understand `package.json`
8. Install packages with `npm install`
9. Understand `node_modules` and why it's gitignored
10. Create a `.gitignore` file
11. Build a working Express web server
12. Add routes that serve different content
13. Serve HTML from the server
14. Understand `localhost` and ports
15. Start and stop a server

## Pedagogical Approach

### Critical Transition: Sandbox to Real Machine

This is the first level where students work on their **actual computer**. The app transitions from an embedded terminal to a **side-by-side guide**.

**Layout change**:
```
+-----------------------------------------------+
| Terminal Trainer (Guide Mode)                  |
+-----------------------------------------------+
|                                                |
|  Step 3 of 15                                  |
|                                                |
|  Open your terminal and type:                  |
|                                                |
|    node -v                                     |
|                        [Copy command]          |
|                                                |
|  You should see something like:                |
|    v20.11.0                                    |
|                                                |
|  If you see "command not found", go back to    |
|  the installation step.                        |
|                                                |
|  [I see a version number] [I got an error]     |
|                                                |
+-----------------------------------------------+
```

**Self-reported progress**: Since we can't validate commands on their real machine, students confirm they completed each step via buttons.

**Error paths**: Every step has a "Something went wrong" branch with troubleshooting tips for common issues.

### Platform-Specific Content

Lessons 5.1 (installation) has separate tracks:
- **Mac**: Install via Homebrew or download from nodejs.org
- **Windows**: Install via download from nodejs.org, with note about PATH

## Lessons

---

### Lesson 5.1: Installing Node.js

**Platform detection**: App detects OS and shows the correct instructions.

**Mac instructions**:
1. Open Terminal
2. Check if Homebrew is installed: `brew -v`
3. If not, install Homebrew (provide command)
4. Install Node: `brew install node`
5. Verify: `node -v` and `npm -v`

**Windows instructions**:
1. Go to nodejs.org
2. Download the LTS version
3. Run the installer (accept defaults)
4. Open PowerShell or Windows Terminal
5. Verify: `node -v` and `npm -v`

**Common issues**:
- "command not found" → need to restart terminal, or PATH not set
- Old version → `brew upgrade node` or reinstall

---

### Lesson 5.2: Your First JavaScript (`node` REPL)

**Instruction**: "Node.js lets you run JavaScript outside the browser. Let's try it interactively."

**Steps**:

| Step | Instruction | Expected Action |
|------|------------|----------------|
| 1 | "Type `node` in your terminal to enter interactive mode." | Student types `node`, sees `>` prompt |
| 2 | "Type `2 + 2` and press Enter." | Sees `4` — the computer calculated it |
| 3 | "Type `\"Hello\".toUpperCase()`." | Sees `'HELLO'` — string manipulation |
| 4 | "Type `Math.random()`." | Sees a random number — built-in functions |
| 5 | "Type `console.log(\"I am writing JavaScript\")`." | Sees the message printed |
| 6 | "Press Ctrl+C twice to exit." | Back to normal terminal |

**Key Point**: "You just wrote and ran JavaScript. The `node` REPL (Read-Eval-Print-Loop) is like a calculator for code."

---

### Lesson 5.3: Running a JavaScript File

**Steps**:

| Step | Instruction | Expected Action |
|------|------------|----------------|
| 1 | "Create a file: `echo 'console.log(\"Hello from a file!\")' > hello.js`." | File created |
| 2 | "Run it: `node hello.js`." | Sees "Hello from a file!" |
| 3 | "Edit to add more: add another console.log line." | Student modifies file |
| 4 | "Run again: `node hello.js`." | Sees both lines |

**Key Point**: "This is the core loop: write code in a file, run it with `node filename.js`, see the result. Every developer does this thousands of times."

---

### Lesson 5.4: What Is npm?

**Concept**: npm (Node Package Manager) is a store for JavaScript code that other developers have written and shared.

**Key Points**:
- npm has over 2 million packages
- Instead of writing everything from scratch, you install packages that solve common problems
- Examples:
  - `express` — build a web server
  - `axios` — make HTTP requests
  - `dayjs` — work with dates
  - `chalk` — colorize terminal output
- npm comes installed with Node.js (that's why you ran `npm -v` earlier)

---

### Lesson 5.5: Creating a Project (`npm init`)

**Steps**:

| Step | Instruction | Expected Action |
|------|------------|----------------|
| 1 | "Create a project folder: `mkdir my-server && cd my-server`." | In new folder |
| 2 | "Initialize the project: `npm init -y`." | `package.json` created |
| 3 | "Read it: `cat package.json`." | JSON config file displayed |

**Explanation**: Walk through each field in package.json:
- `name` — your project name
- `version` — your project version
- `main` — the entry point file
- `scripts` — commands you can run with `npm run`
- `dependencies` — packages your project needs (empty for now)

---

### Lesson 5.6: Installing Packages (`npm install`)

**Steps**:

| Step | Instruction | Expected Action |
|------|------------|----------------|
| 1 | "Install Express (a web server framework): `npm install express`." | Package downloaded |
| 2 | "Check package.json again: `cat package.json`." | `express` appears in dependencies |
| 3 | "Notice the new `node_modules` folder: `ls`." | node_modules/ visible |
| 4 | "Peek inside: `ls node_modules | head -20`." | Dozens of packages |

**Explanation**: "Express depends on other packages, which depend on other packages. npm downloads all of them. The `node_modules` folder can get huge — that's normal."

---

### Lesson 5.7: .gitignore — What Not to Track

**Steps**:

| Step | Instruction | Expected Action |
|------|------------|----------------|
| 1 | "Create a .gitignore file: `echo \"node_modules/\" > .gitignore`." | File created |
| 2 | "Why? node_modules can be thousands of files. Anyone who clones your project can recreate it by running `npm install`." | Understanding |
| 3 | "Also add: `echo \".env\" >> .gitignore`." | Appended |

**Key Point**: "Three things that should NEVER be committed: `node_modules/` (too big, regeneratable), `.env` (secrets), and any files with passwords or API keys."

---

### Lesson 5.8: Hello World Server (10 Lines)

**Instruction**: "Time to build something real. Create a file called `app.js` and type this code."

**Code provided** (student types or copies):
```javascript
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello, World! This is my first server.');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
```

**Explanation line by line**:
1. `require('express')` — load the express package you installed
2. `express()` — create a new server application
3. `port = 3000` — the server will listen on port 3000
4. `app.get('/')` — when someone visits the root URL, do this...
5. `res.send(...)` — send this text back as the response
6. `app.listen(port)` — start the server and listen for requests

---

### Lesson 5.9: Running Your Server

**Steps**:

| Step | Instruction | Expected Action |
|------|------------|----------------|
| 1 | "Start the server: `node app.js`." | "Server running at http://localhost:3000" |
| 2 | "Open your browser and go to `http://localhost:3000`." | "Hello, World!" message displayed |
| 3 | "Go back to the terminal. The server is still running — it's waiting for more requests." | Terminal shows server is active |

**Celebration Moment**: "You just built a web server. A real one. When you visited localhost:3000, your browser sent an HTTP GET request to your server (Level 4, remember?), and your server responded with text. You just did what every backend developer does."

---

### Lesson 5.10: What Is localhost?

**Concept**: `localhost` is your own computer acting as a server.

**Key Points**:
- `localhost` = "this computer" (IP address 127.0.0.1)
- The `:3000` is the port number — like an apartment number at an address
- Your server is only accessible to you right now (not the internet)
- In Level 7, you'll deploy it so anyone can access it

---

### Lesson 5.11: Adding Routes

**Instruction**: "Let's make the server respond to different URLs."

**Code additions**:
```javascript
app.get('/about', (req, res) => {
  res.send('This is the about page. I built this server myself!');
});

app.get('/contact', (req, res) => {
  res.send('Contact me at: hello@mysite.com');
});
```

**Steps**:
1. Add the routes to app.js
2. Stop the server (Ctrl+C)
3. Restart: `node app.js`
4. Visit `localhost:3000/about` and `localhost:3000/contact`

**Key Point**: "Each `app.get('/path')` creates a new endpoint. This is how APIs work — different URLs return different data."

---

### Lesson 5.12: Serving JSON (Building an API)

**Instruction**: "Real APIs don't return plain text — they return JSON."

**Code addition**:
```javascript
app.get('/api/time', (req, res) => {
  res.json({
    time: new Date().toLocaleTimeString(),
    date: new Date().toLocaleDateString()
  });
});
```

**Steps**:
1. Add the route
2. Restart server
3. Visit `localhost:3000/api/time`
4. See JSON response in browser

**Connection to Level 4**: "Remember JSON from Level 4? Your server is now speaking the same language that every API on the internet uses."

---

### Lesson 5.13: Serving HTML

**Instruction**: "Let's serve a real web page instead of plain text."

**Create `public/index.html`**:
```html
<!DOCTYPE html>
<html>
<head>
  <title>My First Server</title>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 50px auto; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <h1>Welcome to My Server</h1>
  <p>This page is being served by Node.js and Express.</p>
  <p>I built this myself.</p>
</body>
</html>
```

**Update app.js** to serve static files:
```javascript
app.use(express.static('public'));
```

**Result**: Visiting `localhost:3000` now shows a styled HTML page.

---

### Lesson 5.14: Stopping and Restarting

**Key Points**:
- `Ctrl+C` stops the server
- Changes to code require a restart
- The workflow: edit code → stop server → start server → test
- "In the future, tools like `nodemon` auto-restart for you, but it's important to understand the manual process first"

---

### Lesson 5.15: Final Challenge

**Build a complete server with**:
- `GET /` → serves an HTML welcome page
- `GET /about` → serves an HTML about page
- `GET /api/time` → returns JSON with current time
- `GET /api/greeting?name=Sara` → returns `{ "greeting": "Hello, Sara!" }`
- Proper `.gitignore`
- Pushed to GitHub

**On Completion**:
```
Level 5 Complete: Building With Real Tools

You can now:
  - Install and use Node.js
  - Create projects with npm
  - Install and use packages
  - Build a web server from scratch
  - Create API endpoints that return JSON
  - Serve HTML pages

The key insight: Building software isn't about memorizing
syntax. It's about understanding the pieces (server, routes,
responses) and assembling them. And soon, Claude Code will
help you assemble them much faster.

Next up: Level 6 — Claude Code
```

## Technical Notes

### Implementation: Guide Mode

This level uses a different UI mode since the student works on their real machine:

- No embedded terminal
- Step-by-step instructions with "Copy" buttons for commands
- "I did it" / "I got an error" buttons for progress
- Platform toggle (Mac / Windows) for platform-specific commands
- Troubleshooting expandable sections for common errors
- Code blocks with syntax highlighting and line numbers

### Components Needed

- `PlatformToggle`: Switch between Mac and Windows instructions
- `CodeBlock`: Syntax-highlighted code with copy button and line numbers
- `StepConfirmation`: "I did it" / "Something went wrong" buttons
- `TroubleshootingPanel`: Expandable error resolution guides
- `BrowserPreview`: Mockup showing what localhost:3000 should look like
