import { z } from 'zod';
import { generateJsonWithProvider, type AIProvider } from './aiClient.js';

const paletteResponseSchema = z.object({
  name: z.string().min(1).max(100),
  dark: z.record(z.string(), z.string()),
  light: z.record(z.string(), z.string()),
});

const SYSTEM_PROMPT = `You are a color palette designer for a dark-themed terminal education web app.
Generate a cohesive, visually appealing color palette with these exact CSS variable tokens.

Backgrounds (dark mode should be dark, light mode should be light):
- --color-bg-primary: main background
- --color-bg-secondary: slightly elevated surface
- --color-bg-card: card surfaces
- --color-bg-elevated: elevated elements (inputs, hover states)

Text (must have WCAG AA contrast against bg-primary):
- --color-text-primary: main text
- --color-text-secondary: secondary text
- --color-text-muted: subtle/disabled text

Accents:
- --color-purple: primary accent (buttons, links, highlights) — despite the name, this can be any color
- --color-green: success states
- --color-blue: info states
- --color-red: error states
- --color-yellow: warning states

Borders:
- --color-border: subtle border (use rgba format, e.g. rgba(255, 255, 255, 0.06))
- --color-border-strong: visible border (use rgba format, e.g. rgba(255, 255, 255, 0.12))

Rules:
- All color values must be valid CSS (hex #RRGGBB for solid colors, rgba() for borders)
- Dark mode backgrounds should be dark (luminance < 0.1)
- Light mode backgrounds should be light (luminance > 0.8)
- Text colors must pass WCAG AA contrast (4.5:1) against their mode's bg-primary
- Accents should be vibrant and distinguishable from each other
- The palette should feel cohesive with a clear identity/mood

Return ONLY valid JSON, no markdown fences or extra text:
{ "name": "Palette Name", "dark": { "--color-bg-primary": "#...", ... }, "light": { "--color-bg-primary": "#...", ... } }`;

// Simple in-memory rate limiter: max 10 generations per hour per admin
const rateLimits = new Map<string, number[]>();
const MAX_PER_HOUR = 10;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const timestamps = (rateLimits.get(userId) || []).filter((t) => t > hourAgo);
  if (timestamps.length >= MAX_PER_HOUR) return false;
  timestamps.push(now);
  rateLimits.set(userId, timestamps);
  return true;
}

export async function generatePalette(
  hint?: string,
  userId?: string,
  provider: AIProvider = 'anthropic',
): Promise<{ name: string; dark: Record<string, string>; light: Record<string, string>; inputTokens: number; outputTokens: number; model: string }> {

  if (userId && !checkRateLimit(userId)) {
    throw new Error('Rate limit exceeded. Max 10 generations per hour.');
  }

  const userMessage = hint
    ? `Generate a color palette inspired by: "${hint}"`
    : 'Generate a unique, creative color palette with a distinctive mood.';

  const ai = await generateJsonWithProvider({
    provider,
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: userMessage,
    maxTokens: 1024,
    anthropicModel: 'claude-sonnet-4-20250514',
    geminiModel: 'gemini-2.5-flash',
  });

  // Parse and validate
  const parsed = JSON.parse(ai.text);
  const validated = paletteResponseSchema.parse(parsed);

  return {
    ...validated,
    inputTokens: ai.inputTokens,
    outputTokens: ai.outputTokens,
    model: ai.model,
  };
}
