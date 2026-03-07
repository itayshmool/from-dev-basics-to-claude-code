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

