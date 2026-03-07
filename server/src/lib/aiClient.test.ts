import { describe, expect, it } from 'vitest';

async function getParser() {
  process.env.DATABASE_URL ??= 'postgresql://localhost:5432/test';
  process.env.JWT_SECRET ??= 'test-jwt-secret-1234';
  process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-1234';
  const mod = await import('./aiClient.js');
  return mod.parseJsonFromModelText;
}

describe('parseJsonFromModelText', () => {
  it('parses plain JSON text', async () => {
    const parseJsonFromModelText = await getParser();
    const parsed = parseJsonFromModelText('{"name":"Ocean"}') as { name: string };
    expect(parsed.name).toBe('Ocean');
  });

  it('parses fenced json blocks', async () => {
    const parseJsonFromModelText = await getParser();
    const parsed = parseJsonFromModelText('```json\n{"name":"Forest"}\n```') as { name: string };
    expect(parsed.name).toBe('Forest');
  });

  it('parses json object surrounded by prose', async () => {
    const parseJsonFromModelText = await getParser();
    const parsed = parseJsonFromModelText('Here is the result:\n{"name":"Sunset"}\nThanks!') as { name: string };
    expect(parsed.name).toBe('Sunset');
  });

  it('throws when no JSON object exists', async () => {
    const parseJsonFromModelText = await getParser();
    expect(() => parseJsonFromModelText('not json')).toThrow('Model response did not contain valid JSON');
  });
});
