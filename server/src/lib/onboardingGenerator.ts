import { z } from 'zod';
import { generateJsonWithProvider, parseJsonFromModelText, type AIProvider } from './aiClient.js';

const planResponseSchema = z.object({
  summary: z.string().min(1),
  recommendedLessons: z.array(z.string()),
  levelNotes: z.array(
    z.object({
      levelId: z.number(),
      note: z.string(),
      priority: z.enum(['high', 'medium', 'low', 'skip']),
    }),
  ),
});

export type OnboardingPlan = z.infer<typeof planResponseSchema>;

// In-memory rate limiter: max 3 generations per hour per user
const rateLimits = new Map<string, number[]>();
const MAX_PER_HOUR = 3;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const timestamps = (rateLimits.get(userId) || []).filter((t) => t > hourAgo);
  if (timestamps.length >= MAX_PER_HOUR) return false;
  timestamps.push(now);
  rateLimits.set(userId, timestamps);
  return true;
}

const SYSTEM_PROMPT = `You are an expert learning advisor for "From Zero to Claude Code", a web app that teaches non-technical people how to use the terminal and eventually build software with AI assistance.

The curriculum has 9 levels with 102 total lessons. Here is the full list:

## Level 0 (id: 0) — "Computers Are Not Magic" (6 lessons)
Files, folders, paths, and what a terminal actually is.
- 0.1 What Is a File?
- 0.2 What Is a Folder?
- 0.3 What Is a File Path?
- 0.4 File Types and What's Inside
- 0.5 What Is a Program?
- 0.6 What Is a Terminal?

## Level 1 (id: 1) — "Your First 30 Minutes in the Terminal" (13 lessons)
Navigate, create, and manage files like a developer.
- 1.1 Where Am I? (pwd)
- 1.2 What's Here? (ls)
- 1.3 Moving Into Folders (cd)
- 1.4 Going Back Up (cd ..)
- 1.5 Going Home (cd ~)
- 1.6 Creating Folders (mkdir)
- 1.7 Creating Files (touch)
- 1.8 Deleting Files (rm)
- 1.9 Deleting Folders (rm -r)
- 1.10 Copying Files (cp)
- 1.11 Moving and Renaming (mv)
- 1.12 Putting It All Together
- 1.13 Level 1 Review

## Level 2 (id: 2) — "Reading and Writing Files" (13 lessons)
Look inside files, search for text, and chain commands together.
- 2.1 Looking Inside Files (cat)
- 2.2 Peeking at the Top (head)
- 2.3 Peeking at the End (tail)
- 2.4 Printing Text (echo)
- 2.5 Writing to Files (>)
- 2.6 Appending to Files (>>)
- 2.7 Copying File Contents
- 2.8 Searching Inside Files (grep)
- 2.9 Searching Across Folders
- 2.10 Chaining Commands with Pipes (|)
- 2.11 Counting with wc
- 2.12 Detective Work
- 2.13 Level 2 Review

## Level 3 (id: 3) — "Your Code Has a History" (17 lessons)
Git and GitHub — never lose your work again.
- 3.1 Why Version Control?
- 3.2 Starting a Repository (git init)
- 3.3 Staging Changes (git add)
- 3.4 Your First Commit (git commit)
- 3.5 Making Changes
- 3.6 Viewing History (git log)
- 3.7 Seeing What Changed (git diff)
- 3.8 Undoing Changes
- 3.9 Understanding GitHub
- 3.10 Pushing to GitHub (git push)
- 3.11 Downloading Projects (git clone)
- 3.12 Creating Branches
- 3.13 Merging Branches
- 3.14 The Professional Workflow
- 3.15 Writing Good Commits
- 3.16 Full Workflow Challenge
- 3.17 Level 3 Review

## Level 4 (id: 4) — "How Software Actually Works" (14 lessons)
Client, server, APIs, databases, and the cloud — demystified.
- 4.1 What Is Code?
- 4.2 Programming Languages
- 4.3 What Is a Website, Really?
- 4.4 Client vs Server
- 4.5 HTTP — How Computers Talk
- 4.6 What Is an API?
- 4.7 JSON — The Universal Data Format
- 4.8 What Is a Database?
- 4.9 SQL — Talking to Databases
- 4.10 Frontend vs Backend
- 4.11 The Tech Stack
- 4.12 What Is the Cloud?
- 4.13 Deployment
- 4.14 DNS and Domains

## Level 4B (id: 45) — "Talk to the Internet" (12 lessons)
Make real HTTP requests, call real APIs, read real data.
- 4b.1 What Is a URL, Really?
- 4b.2 Your First curl
- 4b.3 Query Parameters in Action
- 4b.4 Status Codes Are a Language
- 4b.5 Request Headers
- 4b.6 Sending Data — POST Requests
- 4b.7 Your First Real API
- 4b.8 What Is an API Key?
- 4b.9 Calling the GitHub API
- 4b.10 Reading API Documentation
- 4b.11 When Things Go Wrong
- 4b.12 From curl to Code

## Level 5 (id: 5) — "Building With Real Tools" (15 lessons)
Install Node.js, run code, build a real server.
- 5.1 Installing Node.js
- 5.2 Your First JavaScript
- 5.3 Running a JavaScript File
- 5.4 What Is npm?
- 5.5 Creating a Project
- 5.6 Installing Packages
- 5.7 .gitignore — What Not to Track
- 5.8 Hello World Server
- 5.9 Running Your Server
- 5.10 What Is localhost?
- 5.11 Adding Routes
- 5.12 Serving JSON (Building an API)
- 5.13 Serving HTML
- 5.14 Stopping and Restarting
- 5.15 Level 7 Challenge

## Level 6 (id: 6) — "Claude Code — Your AI Pair Programmer" (15 lessons)
Build real projects by describing what you want.
- 6.1 What Is Claude Code?
- 6.2 Installing Claude Code
- 6.3 Your First Conversation
- 6.4 Reading Code with Claude
- 6.5 Creating Files with Claude
- 6.6 Editing Existing Code
- 6.7 Building a Project from a Description
- 6.8 Writing Effective Prompts
- 6.9 Iterating with Claude
- 6.10 Reviewing What Claude Wrote
- 6.11 Debugging with Claude
- 6.12 Git Workflow with Claude
- 6.13 When NOT to Use Claude Code
- 6.14 Tips and Tricks
- 6.15 Level 8 Challenge

## Level 7 (id: 7) — "Junior Developer Patterns" (12 lessons)
Debug, deploy, and work like a professional.
- 7.1 Reading Someone Else's Code
- 7.2 Understanding Code You Didn't Write
- 7.3 The Debugging Mindset
- 7.4 Console.log Debugging
- 7.5 Finding Answers
- 7.6 Working with External APIs
- 7.7 Environment Variables for Secrets
- 7.8 Basic Security Awareness
- 7.9 Deploying to the Internet
- 7.10 Custom Domains
- 7.11 The Professional Developer Workflow
- 7.12 What's Next — Your Learning Path

Based on the user's background, experience, and goals, create a personalized learning plan:
1. Assign each level a priority (high/medium/low/skip) with a brief note explaining why.
2. Pick the specific lessons they should definitely do (recommendedLessons) — be selective, 15-40 lesson IDs.
3. Write a brief, encouraging summary tailored to their situation.

Rules:
- Always recommend Level 0 basics for true beginners; skip for tech-savvy users who already know what files/folders/terminals are.
- If someone mentions Git experience, Level 3 can be low priority.
- If someone's goal involves AI/Claude Code, make sure Levels 5-7 are high priority.
- For people who already use ChatGPT, they'll relate to Level 6 quickly — still recommend it but note the transition.
- recommendedLessons should include 15-40 lesson IDs — not all 102. Be selective based on their background.
- Each levelNote should explain WHY that priority was chosen, in a friendly conversational tone.
- The summary should be 2-3 sentences, warm and motivating.
- You MUST include a levelNote for every level (all 9: ids 0, 1, 2, 3, 4, 45, 5, 6, 7).

Return ONLY valid JSON, no markdown fences or extra text:
{"summary":"...","recommendedLessons":["0.1",...],"levelNotes":[{"levelId":0,"note":"...","priority":"..."},...]}`;

export async function generateOnboardingPlan(
  userBackground: string,
  userId: string,
  provider: AIProvider = 'anthropic',
): Promise<{ plan: OnboardingPlan; inputTokens: number; outputTokens: number; model: string }> {
  if (!checkRateLimit(userId)) {
    throw new Error('Rate limit exceeded. Max 3 plans per hour.');
  }

  const ai = await generateJsonWithProvider({
    provider,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: userBackground,
    maxTokens: 2048,
    anthropicModel: 'claude-sonnet-4-20250514',
    geminiModel: 'gemini-2.5-flash',
  });

  const parsed = parseJsonFromModelText(ai.text);
  const validated = planResponseSchema.parse(parsed);

  return {
    plan: validated,
    inputTokens: ai.inputTokens,
    outputTokens: ai.outputTokens,
    model: ai.model,
  };
}
