import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./aiClient.js', () => ({
  generateJsonWithProvider: vi.fn(),
  parseJsonFromModelText: vi.fn((text: string) => JSON.parse(text)),
}));

vi.mock('./env.js', () => ({
  env: {
    ANTHROPIC_API_KEY: 'test-anthropic-key',
  },
}));

function makeValidPlan(recommendedCount = 20) {
  const levelIds = [0, 1, 2, 3, 4, 45, 5, 6, 7];
  return {
    summary: 'Valid plan',
    recommendedLessons: Array.from({ length: recommendedCount }, (_v, i) => `${Math.floor(i / 5)}.${(i % 5) + 1}`),
    levelNotes: levelIds.map((levelId) => ({
      levelId,
      note: `Note ${levelId}`,
      priority: 'high' as const,
    })),
  };
}

describe('generateOnboardingPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retries when first response is not JSON and succeeds on second attempt', async () => {
    const { generateJsonWithProvider } = await import('./aiClient.js');
    const { generateOnboardingPlan } = await import('./onboardingGenerator.js');

    vi.mocked(generateJsonWithProvider)
      .mockResolvedValueOnce({
        text: 'I cannot comply',
        inputTokens: 10,
        outputTokens: 10,
        model: 'gemini-2.5-flash',
      })
      .mockResolvedValueOnce({
        text: JSON.stringify(makeValidPlan(20)),
        inputTokens: 20,
        outputTokens: 20,
        model: 'gemini-2.5-flash',
      });

    const result = await generateOnboardingPlan('I am a legal lead who wants to learn Claude Code', 'retry-user-1', 'gemini');
    expect(result.plan.recommendedLessons).toHaveLength(20);
    expect(vi.mocked(generateJsonWithProvider)).toHaveBeenCalledTimes(2);
  });

  it('normalizes oversized lesson lists down to the 40-item max', async () => {
    const { generateJsonWithProvider } = await import('./aiClient.js');
    const { generateOnboardingPlan } = await import('./onboardingGenerator.js');

    vi.mocked(generateJsonWithProvider).mockResolvedValueOnce({
      text: JSON.stringify(makeValidPlan(52)),
      inputTokens: 30,
      outputTokens: 30,
      model: 'claude-sonnet-4-20250514',
    });

    const result = await generateOnboardingPlan('I lead product legal and want to build internal tools', 'retry-user-2', 'anthropic');
    expect(result.plan.recommendedLessons).toHaveLength(40);
    expect(vi.mocked(generateJsonWithProvider)).toHaveBeenCalledTimes(1);
  });

  it('falls back to anthropic when gemini fails to produce parseable JSON', async () => {
    const { generateJsonWithProvider } = await import('./aiClient.js');
    const { generateOnboardingPlan } = await import('./onboardingGenerator.js');

    vi.mocked(generateJsonWithProvider).mockImplementation(async (req) => {
      if (req.provider === 'gemini') {
        return {
          text: 'not-json-response',
          inputTokens: 10,
          outputTokens: 10,
          model: 'gemini-2.5-flash',
        };
      }
      return {
        text: JSON.stringify(makeValidPlan(20)),
        inputTokens: 20,
        outputTokens: 20,
        model: 'claude-sonnet-4-20250514',
      };
    });

    const result = await generateOnboardingPlan('I need a practical path to build tools with AI', 'retry-user-3', 'gemini');
    expect(result.model).toBe('claude-sonnet-4-20250514');
    expect(result.plan.recommendedLessons).toHaveLength(20);
    expect(vi.mocked(generateJsonWithProvider)).toHaveBeenCalledTimes(4);
  });
});
