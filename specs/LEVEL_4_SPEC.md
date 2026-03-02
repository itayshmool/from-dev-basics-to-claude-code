# Level 4 Spec: "How Software Actually Works"

## Overview

| Field | Value |
|-------|-------|
| Level | 4 |
| Title | How Software Actually Works |
| Subtitle | Client, server, APIs, databases, and the cloud — demystified |
| Lessons | 14 |
| Type | Conceptual with interactive diagrams |
| Prerequisite | Level 3 |
| MVP | No |

## Learning Objectives

By the end of Level 4, the student can:

1. Explain what code is and how programming languages differ
2. Describe the client-server model
3. Explain what happens when you visit a website (HTTP request/response cycle)
4. Define what an API is and explain its purpose
5. Read and understand JSON
6. Explain what a database is and why it's needed
7. Describe SQL at a conceptual level
8. Explain the difference between frontend and backend
9. Define what a "tech stack" is and read a job posting's requirements
10. Explain cloud computing in simple terms
11. Understand deployment at a conceptual level
12. Explain how DNS and domains work

## Pedagogical Approach

This is a **conceptual level** — minimal terminal usage. Heavy use of:

- Interactive diagrams that animate to show data flow
- Real-world analogies for every concept
- "Trace the request" exercises where students follow a click through the entire stack
- Quizzes and matching games
- Code snippets shown for illustration (not for typing)

### Why This Level Matters

Students need a mental model of how software works before they build it. Without this, they'll type commands they don't understand. With it, every future lesson has context.

## Lessons

---

### Lesson 4.1: What Is Code?

**Concept**: Code is text that gives instructions to a computer. Every app, website, and game started as text someone typed.

**Key Points**:
- Code is written in plain text files (you can open them in any text editor)
- Different languages have different syntax but do similar things
- Show the same program in 3 languages:

```javascript
// JavaScript
let name = "Sara";
console.log("Hello, " + name);
```

```python
# Python
name = "Sara"
print("Hello, " + name)
```

```
# Plain English equivalent
Set name to "Sara"
Display "Hello, " followed by name
```

- The computer reads the code top to bottom and executes each instruction
- "You don't need to understand the syntax yet — just see that it's readable text"

---

### Lesson 4.2: Programming Languages

**Concept**: Different languages for different jobs.

| Language | Used For | Analogy |
|----------|---------|---------|
| HTML/CSS | Web page structure and style | The blueprint and paint of a house |
| JavaScript | Web interactivity + server | The electricity and plumbing |
| Python | Data, AI, automation, servers | The Swiss Army knife |
| SQL | Talking to databases | The filing clerk's language |
| TypeScript | JavaScript with safety rails | JavaScript wearing a seatbelt |

**Key Point**: "You don't need to learn all of these. In Level 6, Claude Code will write the code. You just need to understand what exists and what each is for."

---

### Lesson 4.3: What Is a Website, Really?

**Interactive Diagram**: Student clicks "Visit website" → animation shows:

1. You type `www.example.com` in browser
2. Browser creates an HTTP request (visualized as a letter/envelope)
3. Request travels to a server (visualized as a computer in a data center)
4. Server finds the files (HTML, CSS, JS)
5. Server sends them back (response envelope)
6. Browser receives files and renders the page
7. You see the website

**Key Point**: "A website is just files on someone else's computer, downloaded to your browser."

---

### Lesson 4.4: Client vs Server

**Concept**: The fundamental architecture of the internet.

**Client (your browser)**:
- Sends requests ("I want this page")
- Receives files (HTML, CSS, JS)
- Displays the content
- Runs JavaScript for interactivity

**Server (remote computer)**:
- Waits for requests
- Processes them (looks up data, runs logic)
- Sends back responses (files, data)
- Runs 24/7

**Analogy**: "Client is the customer at a restaurant. Server is the kitchen. The client orders (request), the kitchen makes it and sends it out (response)."

**Interactive Element**: Drag-and-drop sorting — categorize items as "Client" or "Server":
- Displays the webpage → Client
- Stores user passwords → Server
- Runs JavaScript for a dropdown menu → Client
- Processes a login form → Server
- Saves a new blog post to the database → Server
- Shows an animation when you scroll → Client

---

### Lesson 4.5: HTTP — How Computers Talk

**Concept**: HTTP is the language browsers and servers speak.

**Key Points**:
- HTTP Request has: method (GET, POST), URL, headers, body
- HTTP Response has: status code, headers, body
- Common methods:
  - GET = "Give me something" (loading a page)
  - POST = "Here's some data" (submitting a form)
  - PUT = "Update this" (editing a profile)
  - DELETE = "Remove this" (deleting an account)
- Status codes:
  - 200 = OK (everything worked)
  - 404 = Not Found (page doesn't exist)
  - 500 = Server Error (something broke)

**Interactive Element**: Animated request/response cycle. Student chooses an action ("Load homepage", "Submit login form", "Delete account") and sees the corresponding HTTP request and response animated.

---

### Lesson 4.6: What Is an API?

**Concept**: An API is a defined set of requests a server will accept and respond to.

**Analogy**: "An API is a restaurant menu. You can only order what's on the menu. The kitchen (server) knows how to make each item. If you order something not on the menu, you get an error."

**Example API**:
```
GET  /api/users          → Returns list of all users
GET  /api/users/42       → Returns user #42
POST /api/users          → Creates a new user
PUT  /api/users/42       → Updates user #42
DELETE /api/users/42     → Deletes user #42
```

**Interactive Element**: A mock API explorer. Student "sends" requests and sees responses:
- Click "GET /api/users" → see a list of users (JSON)
- Click "GET /api/users/1" → see one user's details
- Fill in a form and "POST /api/users" → see the created user response

---

### Lesson 4.7: JSON — The Universal Data Format

**Concept**: JSON is how programs share structured data.

**Example**:
```json
{
  "name": "Sara",
  "age": 28,
  "email": "sara@example.com",
  "hobbies": ["reading", "coding", "hiking"],
  "address": {
    "city": "Austin",
    "state": "TX"
  }
}
```

**Key Points**:
- Key-value pairs (like a form: "name" is the label, "Sara" is the answer)
- Curly braces `{}` for objects
- Square brackets `[]` for lists
- Can be nested (objects inside objects)
- Used everywhere: APIs, config files, data storage

**Interactive Element**: JSON builder — student fills out a form (name, age, hobbies) and sees the JSON construct in real-time.

---

### Lesson 4.8: What Is a Database?

**Concept**: A database is organized, persistent storage for data.

**Analogy**: "If your server is a restaurant kitchen, the database is the pantry and recipe book. The kitchen (server) stores and retrieves ingredients (data) from the pantry (database) to make dishes (responses)."

**Key Points**:
- A database is a program that stores data in an organized way
- Data survives server restarts (persistent)
- Most common type: tables (rows and columns, like spreadsheets)
- Example — a `users` table:

| id | name | email | created_at |
|----|------|-------|-----------|
| 1 | Sara | sara@ex.com | 2024-01-15 |
| 2 | Mike | mike@ex.com | 2024-02-20 |
| 3 | Alex | alex@ex.com | 2024-03-10 |

- Types of databases:
  - **SQL** (PostgreSQL, MySQL): Tables with strict structure
  - **NoSQL** (MongoDB): Flexible, JSON-like documents

---

### Lesson 4.9: SQL — Talking to Databases

**Concept**: SQL is the language used to ask questions to a database.

**Examples shown** (not typed):
```sql
-- Get all users
SELECT * FROM users;

-- Get users named Sara
SELECT * FROM users WHERE name = 'Sara';

-- Count users
SELECT COUNT(*) FROM users;

-- Add a new user
INSERT INTO users (name, email) VALUES ('Jo', 'jo@ex.com');

-- Update a user
UPDATE users SET email = 'new@ex.com' WHERE id = 1;

-- Delete a user
DELETE FROM users WHERE id = 3;
```

**Key Point**: "You don't need to memorize SQL. Claude Code can write it for you. But knowing it exists and what it looks like means you can understand and verify what Claude writes."

---

### Lesson 4.10: Frontend vs Backend

**Concept**: A clear division of responsibilities.

| | Frontend | Backend |
|---|---------|---------|
| Where | Browser (client) | Server |
| Languages | HTML, CSS, JavaScript | Node.js, Python, Go, etc. |
| Does | Displays content, handles interaction | Processes data, talks to database |
| Sees | Users see this | Users never see this |
| Example | Login form appearance and validation | Checking password against database |

**Interactive Diagram**: Show a todo app split in half — left side (frontend) shows the UI, right side (backend) shows the server code and database. Arrows show data flowing between them.

---

### Lesson 4.11: The Tech Stack

**Concept**: A "tech stack" is the set of technologies used to build an application.

**Example stacks**:

| Stack Name | Frontend | Backend | Database | Hosting |
|------------|---------|---------|----------|---------|
| MERN | React | Node.js/Express | MongoDB | AWS |
| Python Full Stack | HTML/CSS/JS | Django/Flask | PostgreSQL | Heroku |
| Modern Startup | Next.js | Node.js | PostgreSQL | Vercel + Railway |

**Exercise**: Show a real job posting:
```
"We're looking for a developer experienced in React, Node.js,
PostgreSQL, and AWS deployment."
```

Student matches each technology to its role:
- React → Frontend framework
- Node.js → Backend runtime
- PostgreSQL → Database
- AWS → Cloud hosting

---

### Lesson 4.12: What Is the Cloud?

**Concept**: "The cloud" is other people's computers that you rent.

**Key Points**:
- Instead of buying a physical server, you rent computing power from companies like AWS, Google Cloud, or Microsoft Azure
- You pay for what you use (like electricity)
- Benefits: no hardware to maintain, scale up/down as needed, available worldwide
- Cloud providers offer: servers (compute), databases, file storage, AI services, and hundreds more
- Simpler options exist for smaller projects: Render, Vercel, Railway, Netlify

**Analogy**: "Owning a server is like owning a house. Using the cloud is like renting an apartment. For most people starting out, renting is simpler, cheaper, and you don't need to fix the plumbing yourself."

---

### Lesson 4.13: Deployment

**Concept**: Moving your code from your laptop to a server so the world can access it.

**The deployment flow**:
```
Your laptop → Push to GitHub → Hosting service pulls from GitHub →
  Builds your app → Runs it on a server → Public URL is live
```

**Key Points**:
- Your code runs on `localhost` (your computer) during development
- Deployment makes it available on a public URL
- Most modern platforms auto-deploy when you push to GitHub
- You'll do this yourself in Level 7

---

### Lesson 4.14: DNS and Domains

**Concept**: How `google.com` becomes a computer's address.

**The flow**:
1. You type `example.com`
2. Your browser asks DNS: "What's the address of example.com?"
3. DNS responds: "It's 93.184.216.34"
4. Your browser connects to that address
5. The server at that address sends back the website

**Analogy**: "DNS is the phone book of the internet. You look up a name (domain), it gives you a number (IP address)."

---

## Level 4 Final Exercise

**"Trace the Request"**: An interactive step-through exercise.

Scenario: "You open your browser and visit `www.todoapp.com`. You log in, see your todos, and add a new one."

Student walks through each step and identifies:
1. What the browser sends (HTTP request)
2. What the server does (check password, query database)
3. What data format is used (JSON)
4. What the server sends back (HTTP response)
5. What the browser does with the response (render HTML)

**On Completion**:
```
Level 4 Complete: How Software Actually Works

You now understand:
  - Code is instructions in a text file
  - Websites are files downloaded from servers
  - Clients request, servers respond
  - APIs define what you can ask for
  - JSON is how programs share data
  - Databases store data permanently
  - The tech stack is the combination of tools
  - The cloud is rented computers
  - Deployment makes your code publicly accessible

The key insight: There's no magic. It's just computers
sending files and data to each other over the internet.

Next up: Level 5 — Building With Real Tools
You'll build a real web server that actually runs.
```

## Technical Notes

### Implementation Approach

This level is primarily **interactive content**, not terminal-based:

- Rich animated diagrams (can use React + Framer Motion or similar)
- Interactive drag-and-drop exercises
- Mock API explorer component
- JSON builder component
- Trace-the-request step-through component
- Quiz/matching components (reuse from Level 0)

### No New Terminal Commands

The terminal is not used in this level. All interaction is through custom UI components.
