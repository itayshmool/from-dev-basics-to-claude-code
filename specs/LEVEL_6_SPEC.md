# Level 6 Spec: "Claude Code — Your AI Pair Programmer"

## Overview

| Field | Value |
|-------|-------|
| Level | 6 |
| Title | Claude Code — Your AI Pair Programmer |
| Subtitle | Build real projects by describing what you want |
| Lessons | 15 |
| Type | Hands-on on student's real machine with Claude Code |
| Prerequisite | Level 5 |
| MVP | No |

## Learning Objectives

By the end of Level 6, the student can:

1. Install Claude Code on their machine
2. Launch Claude Code in a project directory
3. Ask Claude Code to explain existing code
4. Ask Claude Code to create new files
5. Ask Claude Code to edit existing files
6. Build a multi-file project through conversation
7. Write effective prompts (specific, contextual, iterative)
8. Review changes Claude makes using `git diff`
9. Iterate on Claude's output ("change X", "add Y")
10. Debug errors using Claude Code
11. Use Claude Code with a git workflow
12. Know when Claude Code is the right tool vs Claude.ai
13. Understand the limits and responsibilities of AI-assisted development
14. Build a complete project from scratch using only conversation

## Pedagogical Approach

### The Mindset Shift

This level fundamentally changes how the student thinks about development:

**Before Level 6**: "I need to learn syntax and type every line"
**After Level 6**: "I need to understand what I want and describe it clearly"

The skill shifts from **writing code** to **directing code** — understanding requirements, reviewing output, and iterating through conversation.

### Teaching Philosophy for AI Tools

1. **Trust but verify**: Always review what Claude wrote before committing
2. **Understand what you ship**: Don't deploy code you can't explain at a high level
3. **Iterate, don't one-shot**: The best results come from conversation, not a single prompt
4. **Context matters**: The more Claude knows about your project, the better its output
5. **You're the architect, Claude is the builder**: You decide what to build; Claude helps you build it

## Lessons

---

### Lesson 6.1: What Is Claude Code?

**Type**: Conceptual

**Content**:

"Claude Code is an AI assistant that lives in your terminal. Unlike Claude.ai (the website), Claude Code can:
- See your project files
- Read your code
- Write and edit files
- Run commands
- Help you build entire projects through conversation

Think of it as a pair programmer who's always available, knows every programming language, and never gets tired. You describe what you want; Claude helps you build it."

**Key Distinction**:
| | Claude.ai (Web) | Claude Code (Terminal) |
|---|---|---|
| Where | Browser | Your terminal |
| Sees your code? | Only if you paste it | Yes — reads your project |
| Edits files? | No | Yes |
| Best for | Questions, brainstorming, writing | Building and editing code projects |

---

### Lesson 6.2: Installing Claude Code

**Steps**:

| Step | Instruction | Expected Action |
|------|------------|----------------|
| 1 | "Install Claude Code: `npm install -g @anthropic-ai/claude-code`." | Package installed globally |
| 2 | "Verify: `claude --version`." | Version number displayed |
| 3 | "Authenticate: `claude` and follow the prompts." | Account connected |

**Troubleshooting**:
- Permission error → `sudo npm install -g ...` (Mac) or run as admin (Windows)
- npm not found → go back to Level 5, Lesson 5.1
- Authentication issues → link to Anthropic account setup

---

### Lesson 6.3: Your First Conversation

**Steps**:

| Step | Instruction | Expected Action |
|------|------------|----------------|
| 1 | "Navigate to a project folder (the one from Level 5 works)." | In project directory |
| 2 | "Type `claude` to start a session." | Claude Code starts, shows prompt |
| 3 | "Type: 'What files are in this project?'" | Claude lists and describes the files |
| 4 | "Type: 'Explain what app.js does in simple terms.'" | Claude explains the server code |

**Key Point**: "Claude can see your entire project. You don't need to paste code — just refer to files by name."

---

### Lesson 6.4: Reading Code with Claude

**Instruction**: "One of Claude Code's best uses: understanding code you didn't write."

**Exercises**:

1. Clone a simple open-source project (provide URL)
2. Start Claude Code in that directory
3. Ask: "Give me an overview of this project — what does it do and how is it structured?"
4. Ask: "Explain what the main file does, line by line"
5. Ask: "What dependencies does this project use and what are they for?"

**Key Point**: "This is how real developers work too. You join a new company, you get a huge codebase, and you need to understand it. Claude accelerates this dramatically."

---

### Lesson 6.5: Creating Files with Claude

**Steps**:

| Step | Instruction | Expected Action |
|------|------------|----------------|
| 1 | "Create a new empty project folder and start Claude." | In empty folder |
| 2 | "Type: 'Create an HTML page with a nav bar containing Home, About, and Contact links. Use a clean, modern style.'" | Claude creates index.html with HTML + CSS |
| 3 | "Open the file in your browser to see the result." | Styled page visible |
| 4 | "Type: 'Create a CSS file that gives this a dark mode color scheme. Link it from the HTML.'" | Claude creates style.css and updates HTML |

**Lesson**: "You described what you wanted in plain English. Claude wrote the code. Your job now is to review it, test it, and iterate."

---

### Lesson 6.6: Editing Existing Code

**Instruction**: "Claude doesn't just create — it modifies. And it knows the context of your existing code."

**Steps**:

| Step | Instruction | Expected Action |
|------|------------|----------------|
| 1 | "Type: 'Add a footer to index.html with copyright 2024 and a link to GitHub.'" | Claude edits the existing file |
| 2 | "Type: 'Make the nav bar sticky so it stays at the top when scrolling.'" | Claude modifies the CSS |
| 3 | "Check the changes: `git diff`" | See exactly what Claude changed |

**Key Point**: "Always review changes before committing. `git diff` shows you exactly what Claude modified."

---

### Lesson 6.7: Building a Project from a Description

**Instruction**: "Let's build something real. Give Claude a full description and watch it work."

**Prompt to use**:
```
Build me a simple bookmark manager web app:
- An HTML page with a form to add bookmarks (URL and title)
- JavaScript that saves bookmarks to localStorage
- A list that displays all saved bookmarks
- Each bookmark has a delete button
- Clean, modern CSS styling
- All in a single-page app (no server needed)
```

**Steps**:
1. Give Claude the full description
2. Let it create the files
3. Open in browser and test
4. Note what works and what you'd change

---

### Lesson 6.8: Writing Effective Prompts

**Concept**: The quality of Claude's output depends on the quality of your input.

**Bad vs Good Prompts**:

| Bad | Good | Why |
|-----|------|-----|
| "Make it look nice" | "Use a dark color scheme with blue accents, sans-serif font, max-width 800px centered" | Specific visual requirements |
| "Add a feature" | "Add a search bar that filters the bookmark list as the user types" | Clear behavior described |
| "Fix it" | "The delete button isn't working — clicking it does nothing. Check the event listener in app.js" | Context about the problem |
| "Build me an app" | "Build a todo app where users can add, complete, and delete tasks. Tasks should persist in localStorage" | Specific features listed |

**Framework for good prompts**:
1. **What**: What you want built/changed
2. **Where**: Which files or components
3. **How**: Specific behavior or appearance
4. **Context**: What already exists, what's not working

---

### Lesson 6.9: Iterating with Claude

**Instruction**: "The best workflow isn't one perfect prompt — it's a conversation."

**Demo workflow**:
```
You: "Build a contact form with name, email, and message fields."
Claude: (creates the form)
You: "Add validation — name and email should be required, email should
      be a valid format."
Claude: (adds validation)
You: "The error messages are showing below the form. Move them inline,
      next to each field."
Claude: (repositions error messages)
You: "Add a success message that appears for 3 seconds after submission."
Claude: (adds success animation)
```

**Key Point**: "Each prompt builds on the last. Claude remembers the conversation and knows the full context of your project."

---

### Lesson 6.10: Reviewing What Claude Wrote

**Instruction**: "Trust but verify. Here's how to review Claude's work."

**Review workflow**:
1. After Claude makes changes, run `git diff` to see what changed
2. Read the diff — understand what was added (green) and removed (red)
3. Test in the browser — does it work?
4. If satisfied, stage and commit
5. If not, tell Claude what to change

**Exercise**: Claude intentionally makes a small mistake (e.g., a typo in a class name). Student uses `git diff` to spot it and asks Claude to fix it.

---

### Lesson 6.11: Debugging with Claude

**Instruction**: "When something breaks, Claude is your debugging partner."

**Scenarios**:

1. **Error in the terminal**:
   - Copy the error message
   - Tell Claude: "I'm getting this error when I run the server: [paste]"
   - Claude explains what's wrong and fixes it

2. **Something looks wrong in the browser**:
   - Describe what you see vs what you expected
   - "The list items are overlapping instead of stacking vertically"
   - Claude diagnoses the CSS issue

3. **Logic bug**:
   - "When I click delete, it removes the wrong bookmark"
   - Claude traces the logic and fixes the index

**Key Point**: "Describing the problem clearly is a skill. The pattern is: 'Expected X, got Y, here's what I tried.'"

---

### Lesson 6.12: Git Workflow with Claude

**Instruction**: "Combine Claude Code with the git workflow you learned in Level 3."

**Workflow**:
```
1. Create a branch:     git checkout -b feature-search
2. Ask Claude to build:  "Add a search bar that filters bookmarks"
3. Review changes:       git diff
4. Stage and commit:     git add . && git commit -m "Add search filter"
5. Test thoroughly
6. Merge to main:        git checkout main && git merge feature-search
7. Push:                 git push
```

**Exercise**: Complete this full workflow for a real feature.

---

### Lesson 6.13: When NOT to Use Claude Code

**Key Points**:

- **Don't use it as a crutch**: If you don't understand what the code does, ask Claude to explain before using it
- **Don't blindly accept**: Always review. Claude can make mistakes
- **Don't skip learning**: Use Claude to learn faster, not to avoid learning
- **Use Claude.ai instead when**: You want to discuss ideas, brainstorm, plan, or write non-code content
- **Use Google/docs instead when**: You need to understand a fundamental concept deeply

**The right mindset**: "Claude is a power tool. A nail gun is faster than a hammer, but you still need to know where the nails go."

---

### Lesson 6.14: Tips and Tricks

**Power user patterns**:

1. **Start with a plan**: "Before writing code, let me describe what I want to build..."
2. **Be specific about files**: "In app.js, change the port from 3000 to 8080"
3. **Ask for explanations**: "Explain what you just did and why"
4. **Request comments**: "Add comments to the complex parts of this code"
5. **Use Claude for git**: "Write a commit message for the current changes"
6. **Ask for tests**: "Write basic tests for the bookmark add and delete functions"

---

### Lesson 6.15: Final Challenge — Build a Complete Project

**Objective**: Build and ship a bookmark manager app using Claude Code.

**Requirements**:
1. Create a new project from scratch
2. Use Claude Code to build:
   - HTML page with a form (URL + title + category)
   - JavaScript with localStorage persistence
   - Display bookmarks grouped by category
   - Search/filter functionality
   - Delete and edit capabilities
   - Responsive design (works on mobile)
3. Iterate at least 4 times (add features incrementally)
4. Review every change with `git diff`
5. Use proper git workflow (branches for each feature)
6. Push to GitHub

**On Completion**:
```
Level 6 Complete: Claude Code — Your AI Pair Programmer

You can now:
  - Install and configure Claude Code
  - Build projects through conversation
  - Write effective prompts
  - Review and iterate on AI-generated code
  - Debug issues with Claude's help
  - Combine Claude Code with a professional git workflow

The key insight: You don't need to memorize syntax. You need
to understand what you want to build and communicate it clearly.
Claude Code turns your ideas into working code.

But remember: you're the architect. Claude is the builder.
Always understand what you ship.

Next up: Level 7 — Junior Developer Patterns
You'll learn to work like a professional developer.
```

## Technical Notes

### Implementation: Enhanced Guide Mode

Same guide mode as Level 5, plus:

- **Prompt templates**: Pre-written prompts students can copy and modify
- **Expected output previews**: What the result should look like after each Claude interaction
- **Code review checklist**: A sidebar checklist students use when reviewing Claude's output
- **Git integration tips**: Reminders to commit at appropriate points

### Components Needed

- `PromptTemplate`: Copyable prompt with customizable placeholders
- `ExpectedResult`: Screenshot/mockup of what the output should look like
- `ReviewChecklist`: Interactive checklist for code review
- `ConversationFlow`: Visual diagram of the iterative prompt workflow
- `ComparisonView`: Side-by-side "Before Claude" / "After Claude" code view
