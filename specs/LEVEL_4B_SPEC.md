# Level 4B Spec: "Talk to the Internet"

## Overview

| Field        | Value                                                      |
| ------------ | ---------------------------------------------------------- |
| Level        | 4B (between Level 4 and Level 5)                           |
| Title        | Talk to the Internet                                       |
| Subtitle     | Make real HTTP requests, call real APIs, read real data    |
| Lessons      | 12                                                         |
| Type         | Hands-on terminal sandbox + guided real-machine exercises  |
| Prerequisite | Level 4                                                    |
| MVP          | No                                                         |

## The Gap This Fills

Level 4 teaches HTTP, APIs, and JSON **conceptually** — through diagrams and mock explorers.
Level 5 teaches students to **build** a server.

Level 4B is the missing bridge: actually **using** HTTP from the terminal. Students make real requests, call real public APIs, read real JSON responses, and handle real errors — before they ever write a server themselves.

This answers the question every student has after Level 4: *"OK I understand it conceptually, but how do I actually do it?"*

---

## Learning Objectives

By the end of Level 4B, the student can:

1. Use `curl` to make HTTP GET requests from the terminal
2. Read a raw HTTP response (headers + body)
3. Understand what a URL is broken into (protocol, host, path, query string)
4. Pass query parameters in a request
5. Pass headers in a request (including `Authorization`)
6. Call a real public API and interpret the JSON response
7. Use `curl -X POST` to send data to an API
8. Understand what an API key is and how to use one safely
9. Read basic API documentation and translate it into a curl command
10. Understand what CORS is and why it exists (from a consumer's perspective)
11. Handle common HTTP errors (401, 403, 404, 429, 500) confidently
12. Understand the difference between a browser request and a terminal request

---

## Pedagogical Approach

This level is a **hybrid**:

- **Lessons 4B.1–4B.6**: Embedded terminal sandbox (like Levels 1–3).
  Students run `curl` commands against a hosted mock API built for the course.
  Responses are validated and explained step by step.

- **Lessons 4B.7–4B.12**: Guide mode (like Level 5).
  Students call real public APIs on their own machine.
  Progress is self-reported. Error paths included for common issues.

### Why curl?

- Universal: available on Mac, Linux, and Windows 10+
- Teaches HTTP explicitly — no abstraction layer
- Every developer uses it for debugging
- Commands translate directly to code (fetch, axios, requests)
- It's what you run to "just check if an API is alive"

### Analogy Thread

Throughout this level: **curl is your walkie-talkie to the internet.**
You speak. The server answers. You learn to speak clearly, listen carefully, and handle static.

---

## Lessons

---

### Lesson 4B.1: What Is a URL, Really?

**Concept**: Every URL is a structured address with distinct parts. You need to be able to read them, not just click them.

**Breakdown of `https://api.github.com/users/itayshmool/repos?per_page=5`**:

```
https://          → Protocol (how to talk)
api.github.com    → Host (who to talk to)
/users/itayshmool/repos  → Path (what to ask for)
?per_page=5       → Query string (extra options)
```

**Interactive Element**: URL dissector — student is given 4 different URLs and drags each part into the correct bucket (protocol / host / path / query).

**Key Point**: "The URL is your request before you've said a word. It tells the server: who you are, where you're going, and what you want."

---

### Lesson 4B.2: Your First curl

**Concept**: `curl` sends HTTP requests from the terminal and prints the response.

**Sandbox steps**:

| Step | Command | What You See |
| ---- | ------- | ------------ |
| 1 | `curl https://mock.zero2claude.dev/hello` | `{"message": "Hello from the internet!"}` |
| 2 | `curl -i https://mock.zero2claude.dev/hello` | Full response with headers above the body |
| 3 | `curl -s https://mock.zero2claude.dev/hello` | Silent mode — body only, no progress meter |

**Annotated output for step 2**:
```
HTTP/2 200
content-type: application/json
date: Mon, 03 Mar 2025 12:00:00 GMT

{"message": "Hello from the internet!"}
```

- `HTTP/2 200` → version + status code
- `content-type` → what format the response body is in
- blank line → separator between headers and body
- everything after → the actual data

**Key Point**: "You just had a conversation with a server. You sent a GET request. It sent back a 200 with JSON. This is the internet."

---

### Lesson 4B.3: Reading Query Parameters

**Concept**: Query parameters (`?key=value`) customize what the server returns — like options on a form.

**Sandbox steps**:

| Command | Response |
| ------- | -------- |
| `curl mock.zero2claude.dev/greet?name=Sara` | `{"greeting": "Hello, Sara!"}` |
| `curl mock.zero2claude.dev/greet?name=Mike&lang=es` | `{"greeting": "Hola, Mike!"}` |
| `curl mock.zero2claude.dev/items?limit=3` | Array of 3 items instead of 10 |

**Interactive element**: Fill-in-the-blank — given a mock API doc entry, student constructs the correct curl command with query parameters.

**Key Point**: "Query parameters are how you filter and customize API responses. They're options, not commands."

---

### Lesson 4B.4: HTTP Status Codes Are a Language

**Concept**: Every response starts with a status code. They're not errors — they're answers.

**Sandbox — intentional errors to read**:

| Command | Code | Meaning |
| ------- | ---- | ------- |
| `curl -i mock.zero2claude.dev/hello` | 200 | OK — worked |
| `curl -i mock.zero2claude.dev/ghost` | 404 | Not Found — path doesn't exist |
| `curl -i mock.zero2claude.dev/secret` | 401 | Unauthorized — you need to identify yourself |
| `curl -i mock.zero2claude.dev/broken` | 500 | Server Error — their problem, not yours |
| `curl -i mock.zero2claude.dev/flood` | 429 | Too Many Requests — slow down |

**Interactive element**: Quiz — given a scenario, what status code do you expect?
- "You tried to load a page that was removed last year" → 404
- "You submitted a login with the wrong password" → 401
- "The database crashed while the server was building your response" → 500
- "You're hammering an API endpoint in a loop" → 429

**Key Point**: "Status codes are the server talking back to you. 2xx = success. 4xx = you did something wrong. 5xx = they did something wrong. Learn the language."

---

### Lesson 4B.5: Sending Headers

**Concept**: Headers are metadata you attach to your request — like how you dress for an occasion.

**Common request headers**:

| Header | Purpose | Example |
| ------ | ------- | ------- |
| `Authorization` | Prove who you are | `Bearer my-token-here` |
| `Content-Type` | Tell the server what format you're sending | `application/json` |
| `Accept` | Tell the server what format you want back | `application/json` |
| `User-Agent` | Identify your client | `curl/7.88.1` |

**Sandbox — using `-H` to add headers**:

```bash
# Without auth header → 401
curl -i mock.zero2claude.dev/private

# With auth header → 200 + data
curl -i mock.zero2claude.dev/private \
  -H "Authorization: Bearer student-demo-key"
```

**Key Point**: "Headers are the envelope around your request. The body is the letter. Some servers read the envelope before they'll even look inside."

---

### Lesson 4B.6: Sending Data — POST Requests

**Concept**: GET fetches data. POST sends data. You need both.

**Syntax**:
```bash
curl -X POST URL \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

**Sandbox steps**:

| Step | Command | Response |
| ---- | ------- | -------- |
| 1 | POST a new todo item to mock API | `{"id": 42, "text": "Learn curl", "done": false}` |
| 2 | GET `/todos` — see your item in the list | Array with 42 included |
| 3 | POST with invalid JSON (missing closing `}`) | 400 Bad Request — see parse error |

**Key Point**: "GET is read. POST is write. One retrieves. One creates. You'll use both constantly."

---

### Lesson 4B.7: Your First Real API (JSONPlaceholder)

**Mode switches to: guided real machine**

**Introduction**: JSONPlaceholder (`jsonplaceholder.typicode.com`) is a free, public fake API used by millions of developers for testing. No sign-up, no API key.

**Guided steps**:

| Step | Instruction | Expected Result |
| ---- | ----------- | --------------- |
| 1 | `curl https://jsonplaceholder.typicode.com/todos/1` | A JSON todo object |
| 2 | `curl https://jsonplaceholder.typicode.com/users` | Array of 10 user objects |
| 3 | `curl https://jsonplaceholder.typicode.com/posts?userId=1` | All posts by user 1 |
| 4 | POST a new post (provided command) | `{"id": 101, ...}` — your created post |

**Reading the response**: Walk through the JSON field by field. What is `userId`? What is `completed`? What types are the values?

**Key Point**: "You just called a real server on the actual internet. No browser, no app — just you and the terminal."

---

### Lesson 4B.8: What Is an API Key?

**Concept**: Many APIs require you to identify yourself with a secret token.

**Why they exist**:
- Rate limiting: prevent abuse
- Billing: track who's using what
- Analytics: see usage patterns
- Authorization: some data is private

**How they work**:
```bash
# Most common pattern
curl https://api.example.com/data \
  -H "Authorization: Bearer YOUR_API_KEY_HERE"

# Some use query params (less secure, but simpler)
curl "https://api.example.com/data?api_key=YOUR_API_KEY_HERE"
```

**Safety rules** (shown as a checklist):
- Never paste your API key in a public place
- Never commit it to Git (add to `.gitignore` via `.env`)
- If you expose it, rotate it immediately
- Use environment variables in code: `process.env.API_KEY`

**Analogy**: "An API key is your hotel key card. The hotel knows who you are, how many rooms you're allowed into, and when your access expires."

---

### Lesson 4B.9: Calling a Real Public API (GitHub)

**Introduction**: GitHub's API is free, requires no auth for public data, and is extensively documented.

**Guided steps**:

| Step | Instruction | Result |
| ---- | ----------- | ------ |
| 1 | `curl https://api.github.com/users/itayshmool` | Your GitHub profile as JSON |
| 2 | `curl https://api.github.com/users/itayshmool/repos` | Your public repos |
| 3 | `curl "https://api.github.com/users/itayshmool/repos?sort=updated&per_page=3"` | 3 most recently updated repos |

**Reading the docs**: Show a screenshot of the GitHub API docs for `GET /users/{username}`. Walk through:
- The endpoint definition
- Path parameters (`{username}`)
- Query parameters (`sort`, `per_page`, `direction`)
- Example response

**Exercise**: "Using only the curl docs pattern you just learned, retrieve the 5 most starred repos for the `facebook` GitHub user, sorted by stars."

---

### Lesson 4B.10: Reading API Documentation

**Concept**: All APIs publish documentation. Reading it is a skill.

**Anatomy of an API doc entry**:
```
GET /repos/{owner}/{repo}/issues

Path parameters:
  owner (string, required) — account owner
  repo  (string, required) — repo name

Query parameters:
  state  (string) — "open", "closed", "all" — default: "open"
  labels (string) — comma-separated list of label names
  per_page (integer) — max 100 — default: 30

Response: Array of issue objects
```

**Exercise — translate doc to curl**:
Student is given 3 doc entries and must write the correct curl command:
1. Get all closed issues for `facebook/react`
2. Get the 10 most recently updated open pull requests for `microsoft/vscode`
3. Get a specific commit by SHA from `torvalds/linux`

**Key Point**: "The skill isn't memorizing APIs. It's knowing how to read any API doc and translate it into a working request in 2 minutes."

---

### Lesson 4B.11: When Things Go Wrong — Error Handling

**Concept**: APIs fail in predictable ways. Knowing how to diagnose errors is as important as making requests.

**Diagnostic checklist**:

```
Got a 4xx?
  401 → Check: Is your API key correct? Did you send the Authorization header?
  403 → Check: Does this key have permission? Are you on a free tier?
  404 → Check: Is the URL path exactly right? Did you typo a username or ID?
  422 → Check: Is your request body valid JSON? Missing required fields?
  429 → Check: Are you sending too many requests? Check the Retry-After header.

Got a 5xx?
  It's their problem. Check the API's status page. Wait and retry.

Got nothing / connection error?
  curl: (6) Could not resolve host → DNS failure or wrong domain
  curl: (7) Failed to connect → server is down or port is wrong
  curl: (35) SSL error → certificate issue or old curl version
```

**Sandbox**: Students intentionally trigger each error type and diagnose them using the checklist.

---

### Lesson 4B.12: From curl to Code

**Concept**: Every curl command you write is one step from real code.

**The translation**:

```bash
# curl
curl https://api.github.com/users/itayshmool \
  -H "Authorization: Bearer TOKEN" \
  -H "Accept: application/json"
```

```javascript
// JavaScript (fetch)
const response = await fetch('https://api.github.com/users/itayshmool', {
  headers: {
    'Authorization': 'Bearer TOKEN',
    'Accept': 'application/json'
  }
});
const data = await response.json();
```

```python
# Python (requests)
import requests
response = requests.get(
  'https://api.github.com/users/itayshmool',
  headers={'Authorization': 'Bearer TOKEN'}
)
data = response.json()
```

**Key Point**: "curl isn't just a debugging tool. It's how you figure out what request to make. Once it works in curl, translating it to code is mechanical — and Claude Code does it instantly."

**Final exercise**: Student writes a curl command that retrieves their GitHub repos sorted by most recent update, then tells Claude Code: *"Translate this curl command into a JavaScript fetch call."* They paste it in and see the result.

---

## Level 4B Final Exercise

**"API Detective"** — a multi-step real API challenge.

The student is given a mission brief:
```
You're building a dashboard that shows today's weather in Tel Aviv,
the 3 most recently updated GitHub repos for a given user,
and the current Bitcoin price in USD.

You don't need to build the frontend yet. First: can you get the data?
Find free APIs for each, read their docs, and write the curl command
that fetches the right data. You have what you need.
```

Three free public APIs are hinted (but not named). Student:
1. Identifies the correct APIs from the hints
2. Reads the docs
3. Writes 3 working curl commands (self-reported)

**On Completion**:
```
Level 4B Complete: Talk to the Internet

You can now:
  ✓ Make real HTTP requests with curl
  ✓ Read URL structure (protocol, host, path, query)
  ✓ Pass headers and authentication tokens
  ✓ Send data with POST requests
  ✓ Read any API response and handle errors
  ✓ Read API documentation and translate it to curl
  ✓ Understand API keys and how to use them safely
  ✓ Translate curl commands into code

The key insight: The internet is just requests and responses.
Once you can make requests from the terminal, you can
consume any service, call any API, and debug anything.
And when you build your own server in Level 5, you'll
understand exactly what it's responding to — because
you've been the one sending the requests.

Next up: Level 5 — Building With Real Tools
```

---

## Technical Notes

### Mock API (mock.zero2claude.dev)

Lessons 4B.1–4B.6 use an embedded sandbox that calls a hosted mock API:

- `GET /hello` → `{ "message": "..." }`
- `GET /greet?name=X&lang=en|es` → `{ "greeting": "..." }`
- `GET /items?limit=N` → Array of N items
- `GET /private` → 401 without header, 200 with `Bearer student-demo-key`
- `GET /ghost` → 404
- `GET /broken` → 500
- `GET /flood` → 429
- `GET /todos`, `POST /todos` → CRUD for demo todos

This mock server should be lightweight and hosted on Render free tier (Node.js + Express). No database needed — in-memory arrays with a reset endpoint.

### Embedded Terminal — New Command

The sandbox terminal must support `curl`:
- Syntax: `curl [flags] URL`
- Supported flags: `-i`, `-s`, `-H "key: value"`, `-X METHOD`, `-d 'body'`
- Output: mocked response (headers + body) printed to terminal
- No real network calls — all responses come from the mock API config in the lesson JSON

### New Lesson JSON Fields

```json
{
  "type": "terminal_step",
  "command": "curl -i mock.zero2claude.dev/hello",
  "expectedOutput": "...",
  "validate": "status_line_200"
}
```

New validator type: `status_line_200` — checks that the first line of output matches `HTTP/X 200`.

### Guide Mode (Lessons 4B.7–4B.12)

Reuses the same guide mode UI introduced in Level 5 (platform toggle, copy buttons, self-reported confirmation, troubleshooting panels). No new components needed.

### Component Reuse

All components are existing:
- `TerminalStep` — for sandbox lessons
- `PlatformToggle`, `CodeBlock`, `StepConfirmation`, `TroubleshootingPanel` — for guide mode lessons
- `FillInBlank`, `Quiz`, `ClickMatch` — for interactive exercises

### Insertion Point

This level slots **between Level 4 and Level 5**. Existing level numbering remains intact — this is additive. Level IDs in the database would shift if levels are renumbered, but the simplest implementation is to add `level: 4.5` or use a string slug `"4b"` for the DB record.
