import Anthropic from '@anthropic-ai/sdk';
import { env } from './env.js';

export type AIProvider = 'anthropic' | 'gemini';

interface AIJsonRequest {
  provider: AIProvider;
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  anthropicModel: string;
  geminiModel: string;
}

interface AIJsonResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}

function findBalancedJsonObject(input: string): string | null {
  const start = input.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = start; i < input.length; i += 1) {
    const ch = input[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (ch === '\\' && inString) {
      escapeNext = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === '{') depth += 1;
    if (ch === '}') depth -= 1;

    if (depth === 0) {
      return input.slice(start, i + 1);
    }
  }

  return null;
}

export function parseJsonFromModelText(rawText: string): unknown {
  const text = rawText.trim();

  try {
    return JSON.parse(text);
  } catch {
    // fall through to recovery strategies
  }

  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    const fenced = fenceMatch[1].trim();
    try {
      return JSON.parse(fenced);
    } catch {
      // fall through
    }
  }

  const objectSlice = findBalancedJsonObject(text);
  if (objectSlice) {
    return JSON.parse(objectSlice);
  }

  throw new Error('Model response did not contain valid JSON');
}

function getGeminiText(response: any): string {
  const parts = response?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .map((p: any) => (typeof p?.text === 'string' ? p.text : ''))
    .join('');
}

export async function generateJsonWithProvider(req: AIJsonRequest): Promise<AIJsonResponse> {
  if (req.provider === 'anthropic') {
    if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured');

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: req.anthropicModel,
      max_tokens: req.maxTokens,
      system: req.systemPrompt,
      messages: [{ role: 'user', content: req.userPrompt }],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    return {
      text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      model: req.anthropicModel,
    };
  }

  if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured');

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${req.geminiModel}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;

  const geminiResponse = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: req.systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: req.userPrompt }] }],
      generationConfig: { maxOutputTokens: req.maxTokens },
    }),
  });

  if (!geminiResponse.ok) {
    const body = await geminiResponse.text().catch(() => '');
    throw new Error(`Gemini request failed (${geminiResponse.status}): ${body.slice(0, 200)}`);
  }

  const data = await geminiResponse.json();
  const text = getGeminiText(data);
  if (!text) throw new Error('Gemini returned empty content');

  return {
    text,
    inputTokens: data?.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: data?.usageMetadata?.candidatesTokenCount ?? 0,
    model: req.geminiModel,
  };
}
