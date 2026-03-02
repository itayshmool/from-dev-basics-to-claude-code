# Level 7 Spec: "Junior Developer Patterns"

## Overview

| Field | Value |
|-------|-------|
| Level | 7 |
| Title | Junior Developer Patterns |
| Subtitle | Debug, deploy, and work like a professional |
| Lessons | 12 |
| Type | Hands-on on student's real machine |
| Prerequisite | Level 6 |
| MVP | No |

## Learning Objectives

By the end of Level 7, the student can:

1. Clone and navigate an unfamiliar codebase
2. Read and understand code they didn't write
3. Apply a systematic debugging methodology
4. Use console.log strategically for debugging
5. Search for solutions using documentation and Stack Overflow
6. Fetch data from external APIs in their projects
7. Use environment variables to manage secrets
8. Understand basic security practices
9. Deploy a project to the internet (Render or Vercel)
10. Understand custom domains at a conceptual level
11. Follow the professional developer workflow (issue → branch → code → PR → merge → deploy)
12. Build a confidence framework for continued self-directed learning

## Pedagogical Approach

This level bridges the gap from "I can build with Claude Code" to "I can work like a developer." The focus is on **patterns and workflows** rather than new tools.

### Key Mindset Goals

- **"I can figure this out"**: Students develop the confidence to troubleshoot independently
- **"I know where to look"**: Students learn how to find answers, not just memorize them
- **"I understand the process"**: The professional workflow becomes second nature
- **"I know what I don't know"**: Honest self-assessment and a path forward

## Lessons

---

### Lesson 7.1: Reading Someone Else's Code

**Instruction**: "In the real world, you'll spend more time reading code than writing it. Here's a systematic approach."

**The Reading Protocol**:
1. Start with `README.md` — what does this project do?
2. Check `package.json` — what tech does it use?
3. Look at the folder structure — how is it organized?
4. Find the entry point (usually `index.js`, `app.js`, or `main.js`)
5. Follow the imports — trace the dependency tree
6. Use Claude Code: "Give me an overview of this project"

**Exercise**: Clone a provided open-source project (simple, well-structured). Answer questions:
- What does this project do?
- What packages does it depend on?
- Where is the main entry point?
- What routes/endpoints does it have?
- How does data flow through the application?

**Key Point**: "You don't need to understand every line. Start with the big picture and zoom in."

---

### Lesson 7.2: Understanding Code You Didn't Write

**Instruction**: "Going deeper — read specific functions and understand what they do."

**Techniques**:
1. Read the function name — it usually describes what it does
2. Read the parameters — what inputs does it expect?
3. Read the return value — what does it output?
4. Trace the logic — follow the code line by line
5. Use Claude: "Explain what this function does in simple terms"

**Exercise**: Read 5 functions of increasing complexity. For each, write a one-sentence description in plain English. Then ask Claude to verify your understanding.

---

### Lesson 7.3: The Debugging Mindset

**Concept**: Debugging is not random trial and error. It's a scientific method.

**The Debugging Process**:
```
1. REPRODUCE: Can you make the bug happen consistently?
2. ISOLATE: Where exactly does it go wrong?
3. HYPOTHESIZE: What do you think is causing it?
4. TEST: Change one thing to test your hypothesis
5. FIX: Apply the fix
6. VERIFY: Does the original bug still happen? Did you break anything else?
```

**Common Beginner Mistakes**:
- Changing multiple things at once (you won't know which fixed it)
- Not reading the error message (it usually tells you exactly what's wrong)
- Assuming the bug is somewhere else (trust the error, not your assumption)
- Giving up too early (debugging is uncomfortable — that's normal)

**Key Point**: "Every developer debugs. Senior developers just do it more systematically."

---

### Lesson 7.4: Console.log Debugging

**Instruction**: "The simplest and most effective debugging tool: print things out."

**Technique**:
```javascript
function processBookmarks(bookmarks) {
  console.log('Input bookmarks:', bookmarks);  // What went in?

  const filtered = bookmarks.filter(b => b.active);
  console.log('After filter:', filtered);  // What came out?
  console.log('Count:', filtered.length);   // How many?

  return filtered.map(b => b.title);
}
```

**Rules**:
1. Log at the START of a function (did it get called? with what?)
2. Log BEFORE and AFTER transformations (what changed?)
3. Log CONDITIONAL branches (which path did it take?)
4. Label every log: `console.log('step 3 - user data:', data)` — not just `console.log(data)`
5. Remove debug logs before committing (or use Claude: "remove all debug console.logs")

**Exercise**: A buggy function is provided. Student adds strategic console.logs to find the bug.

---

### Lesson 7.5: Finding Answers (Docs, Stack Overflow, Search)

**Instruction**: "No developer memorizes everything. Knowing how to search is the real skill."

**How to search effectively**:
1. **Read the error message first** — copy the exact error text
2. **Search with context**: "express cannot GET /api/users" not "my server doesn't work"
3. **Include technology name**: "javascript filter array by property" not "how to filter array"
4. **Check the date**: Prefer results from the last 2-3 years
5. **Official docs first**: MDN for JavaScript, Express docs for Express, etc.

**How to read Stack Overflow**:
- Check the vote count (higher = more trusted)
- Read the accepted answer first
- Read the comments — they often have important corrections
- Don't just copy-paste — understand the solution

**How to read documentation**:
- Look for "Getting Started" or "Quick Start"
- Find the specific function/method you need
- Read the parameters and examples
- Try the examples first, then modify

**Key Point**: "You don't need to memorize. You need to know where to find the answer and how to adapt it."

---

### Lesson 7.6: Working with External APIs

**Instruction**: "Most real applications get data from external services. Let's fetch data from a public API."

**Exercise**: Build a feature that uses a public API.

**Steps**:
1. Install the `node-fetch` package (or use built-in `fetch` in modern Node)
2. Make a GET request to a public API (e.g., weather API, joke API, or GitHub API)
3. Parse the JSON response
4. Display the data

**Example** (weather-like):
```javascript
app.get('/api/weather', async (req, res) => {
  const city = req.query.city || 'London';
  const response = await fetch(`https://api.example.com/weather?city=${city}`);
  const data = await response.json();
  res.json({
    city: data.name,
    temperature: data.main.temp,
    description: data.weather[0].description
  });
});
```

**Key Concepts**:
- `async/await` — a way to wait for external data
- API keys — authentication for APIs (covered in next lesson)
- Rate limits — APIs limit how many requests you can make
- Error handling — what if the API is down?

---

### Lesson 7.7: Environment Variables for Secrets

**Instruction**: "API keys and passwords must NEVER be in your code. Environment variables keep them safe."

**Steps**:

1. Install dotenv: `npm install dotenv`
2. Create `.env` file:
   ```
   API_KEY=your_secret_key_here
   PORT=3000
   ```
3. Add to app.js:
   ```javascript
   require('dotenv').config();
   const apiKey = process.env.API_KEY;
   ```
4. Make sure `.env` is in `.gitignore`
5. Create `.env.example` (template without real values):
   ```
   API_KEY=your_key_here
   PORT=3000
   ```

**Key Rules**:
- NEVER commit `.env` to git
- NEVER share API keys in code, screenshots, or messages
- DO commit `.env.example` so others know what variables are needed
- Each environment (dev, staging, production) has its own `.env`

---

### Lesson 7.8: Basic Security Awareness

**Instruction**: "You don't need to be a security expert, but you need to avoid common mistakes."

**The Big Five (non-negotiable)**:

1. **Never commit secrets**: API keys, passwords, tokens → `.env` + `.gitignore`
2. **Never trust user input**: Sanitize everything that comes from forms or URLs
3. **Use HTTPS**: Always. Never HTTP for anything real
4. **Keep dependencies updated**: `npm audit` shows known vulnerabilities
5. **Don't log sensitive data**: Never `console.log(password)` or `console.log(user.token)`

**Exercise**: Review a code snippet with 3 intentional security mistakes. Student identifies each one.

---

### Lesson 7.9: Deploying to the Internet

**Instruction**: "Your project only runs on `localhost` right now. Let's make it live."

**Using Render (recommended)**:

1. Make sure your project is on GitHub
2. Go to render.com, sign up with GitHub
3. Click "New Web Service"
4. Connect your repository
5. Configure:
   - Build command: `npm install`
   - Start command: `node app.js`
6. Add environment variables (from `.env`)
7. Click Deploy
8. Wait for build to complete
9. Visit your public URL

**Steps verified by student**: Each step has a confirmation checkbox and a troubleshooting section.

**Celebration Moment**: "Someone on the other side of the world can now visit your URL and use your application. You built and deployed a real web service."

---

### Lesson 7.10: Custom Domains (Conceptual)

**Concept**: How `myapp.com` points to your Render server.

**Key Points**:
- You buy a domain from a registrar (Namecheap, Google Domains, etc.)
- You configure DNS to point the domain to your hosting service
- Your hosting service handles the rest (HTTPS certificate, routing)
- Not required — your `.onrender.com` URL works fine for now

---

### Lesson 7.11: The Professional Developer Workflow

**The Full Cycle**:
```
1. ISSUE:    Someone reports a bug or requests a feature
2. BRANCH:   git checkout -b fix-login-bug
3. CODE:     Use Claude Code to implement the fix
4. TEST:     Verify it works locally
5. REVIEW:   git diff, check your own changes
6. COMMIT:   git add . && git commit -m "Fix: login button unresponsive on mobile"
7. PUSH:     git push -u origin fix-login-bug
8. PR:       Create a pull request on GitHub
9. MERGE:    After review, merge to main
10. DEPLOY:  Auto-deploys from main branch
```

**Exercise**: Walk through this entire workflow for a real feature addition to their deployed project.

**Key Point**: "This is exactly how every tech company in the world works. The tools vary, but the process is the same."

---

### Lesson 7.12: What's Next — Your Learning Path

**Content**:

"You've gone from 'what's a terminal?' to deploying a live web application. Here's what comes next, depending on what you want to build."

**Paths**:

| Interest | Learn Next | Resources |
|----------|-----------|-----------|
| Web apps (frontend) | React, Next.js, Tailwind CSS | React docs, Next.js tutorial |
| Web apps (backend) | Express deep dive, PostgreSQL, authentication | Express docs, Prisma tutorial |
| Mobile apps | React Native, Expo | Expo docs |
| Automation/scripts | Python, cron jobs, web scraping | Automate the Boring Stuff (book) |
| Data/AI | Python, pandas, basic ML | fast.ai, Kaggle |

**How to keep learning**:
1. Build projects — this is how you learn fastest
2. Use Claude Code as your tutor — "explain this concept to me"
3. Read other people's code on GitHub
4. Join communities (Reddit, Discord, local meetups)
5. Don't compare yourself to people who've been coding for years

**Final Message**:
```
Level 7 Complete. All Levels Complete.

You started this course not knowing what a file path was.

Now you can:
  - Navigate any computer from the terminal
  - Read, write, and search files with commands
  - Track your code's history with git
  - Understand how web applications work
  - Build web servers from scratch
  - Use AI to accelerate your development
  - Debug systematically
  - Deploy to the internet
  - Follow professional development workflows

You're not pretending to be a developer. You are one.
Junior, but real. And with Claude Code as your pair programmer,
you can build anything you can describe.

The only thing left to do: go build something.
```

## Technical Notes

### Implementation: Guide Mode (Enhanced)

Same as Level 5/6 guide mode, with additions:

- **Deployment wizard**: Step-by-step deployment guide with verification at each step
- **Security checklist**: Interactive checklist for the security audit exercise
- **Workflow diagram**: Visual representation of the PR workflow, highlighted step by step
- **Path selector**: Interactive quiz at the end that recommends a learning path

### Components Needed

- `DeploymentWizard`: Multi-step deployment guide with platform-specific instructions
- `SecurityAudit`: Code review exercise with hidden vulnerabilities to find
- `WorkflowDiagram`: Animated diagram of the PR workflow
- `PathRecommender`: Quiz-based learning path recommendation
- `CertificateView`: Completion certificate/summary the student can screenshot or share

### Completion Tracking

On finishing Level 7:
- Show a completion summary with all skills learned
- Offer to "restart" any level for review
- Provide links to next-step resources
- Optionally generate a shareable completion badge
