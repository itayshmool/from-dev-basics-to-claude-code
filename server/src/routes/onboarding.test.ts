import { describe, it, expect, vi, beforeEach } from 'vitest';

function createQueryChain(result: unknown) {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) => resolve(result);
      }
      return vi.fn().mockReturnValue(new Proxy({}, handler));
    },
  };
  return new Proxy({}, handler);
}

vi.mock('../db/index.js', () => ({
  db: {
    select: vi.fn().mockImplementation(() => createQueryChain([])),
    insert: vi.fn().mockImplementation(() => createQueryChain([])),
  },
}));

vi.mock('../lib/jwt.js', () => ({
  signAccessToken: vi.fn(),
  signRefreshToken: vi.fn(),
  verifyRefreshToken: vi.fn(),
  verifyAccessToken: vi.fn().mockReturnValue({ userId: 'user-123', role: 'student' }),
}));

vi.mock('../lib/onboardingGenerator.js', () => ({
  generateOnboardingPlan: vi.fn().mockResolvedValue({
    plan: {
      summary: 'Custom plan',
      recommendedLessons: ['0.1', '1.1'],
      levelNotes: [
        { levelId: 0, note: 'Basics first', priority: 'high' },
        { levelId: 1, note: 'Do next', priority: 'high' },
        { levelId: 2, note: 'Good foundation', priority: 'medium' },
        { levelId: 3, note: 'Later', priority: 'low' },
        { levelId: 4, note: 'Later', priority: 'low' },
        { levelId: 45, note: 'Optional', priority: 'skip' },
        { levelId: 5, note: 'Important', priority: 'high' },
        { levelId: 6, note: 'Important', priority: 'high' },
        { levelId: 7, note: 'Important', priority: 'high' },
      ],
    },
    inputTokens: 100,
    outputTokens: 200,
    model: 'claude-sonnet-4-20250514',
  }),
}));

const { onboardingRouter } = await import('./onboarding.js');
const express = (await import('express')).default;
const request = (await import('supertest')).default;
const { errorHandler } = await import('../middleware/errorHandler.js');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/onboarding', onboardingRouter);
  app.use(errorHandler);
  return app;
}

describe('POST /api/onboarding/generate provider selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses gemini provider when ai_provider setting is gemini', async () => {
    const { db } = await import('../db/index.js');
    const { generateOnboardingPlan } = await import('../lib/onboardingGenerator.js');

    vi.mocked(db.select)
      .mockImplementationOnce(() => createQueryChain([{ key: 'ai_onboarding_enabled', value: true }]) as ReturnType<typeof db.select>)
      .mockImplementationOnce(() => createQueryChain([{ key: 'ai_provider', value: 'gemini' }]) as ReturnType<typeof db.select>);

    const app = createApp();
    const res = await request(app)
      .post('/api/onboarding/generate')
      .set('Authorization', 'Bearer token')
      .send({ background: 'I am a designer and I want to learn Claude Code quickly.' });

    expect(res.status).toBe(200);
    expect(vi.mocked(generateOnboardingPlan)).toHaveBeenCalledWith(
      'I am a designer and I want to learn Claude Code quickly.',
      'user-123',
      'gemini',
    );
  });

  it('falls back to anthropic provider when ai_provider setting is missing', async () => {
    const { db } = await import('../db/index.js');
    const { generateOnboardingPlan } = await import('../lib/onboardingGenerator.js');

    vi.mocked(db.select)
      .mockImplementationOnce(() => createQueryChain([{ key: 'ai_onboarding_enabled', value: true }]) as ReturnType<typeof db.select>)
      .mockImplementationOnce(() => createQueryChain([]) as ReturnType<typeof db.select>);

    const app = createApp();
    const res = await request(app)
      .post('/api/onboarding/generate')
      .set('Authorization', 'Bearer token')
      .send({ background: 'I am switching careers and need a plan for learning terminal fundamentals.' });

    expect(res.status).toBe(200);
    expect(vi.mocked(generateOnboardingPlan)).toHaveBeenCalledWith(
      'I am switching careers and need a plan for learning terminal fundamentals.',
      'user-123',
      'anthropic',
    );
  });
});

