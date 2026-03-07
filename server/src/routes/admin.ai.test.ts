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
    update: vi.fn().mockImplementation(() => createQueryChain([])),
    delete: vi.fn().mockImplementation(() => createQueryChain([])),
  },
}));

vi.mock('../lib/password.js', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed'),
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

vi.mock('../lib/jwt.js', () => ({
  signAccessToken: vi.fn().mockReturnValue('mock-access-token'),
  signRefreshToken: vi.fn().mockReturnValue('mock-refresh-token'),
  verifyRefreshToken: vi.fn().mockReturnValue({ userId: 'admin-123', role: 'admin' }),
  verifyAccessToken: vi.fn().mockReturnValue({ userId: 'admin-123', role: 'admin' }),
}));

vi.mock('../lib/paletteGenerator.js', () => ({
  generatePalette: vi.fn().mockResolvedValue({
    name: 'AI Generated',
    dark: { '--color-bg-primary': '#1a1a2e' },
    light: { '--color-bg-primary': '#f0f0f0' },
    inputTokens: 12,
    outputTokens: 34,
    model: 'claude-sonnet-4-20250514',
  }),
}));

vi.mock('../lib/aiClient.js', () => ({
  generateJsonWithProvider: vi.fn().mockResolvedValue({
    text: '{"ok":true}',
    inputTokens: 11,
    outputTokens: 7,
    model: 'gemini-2.5-flash',
  }),
}));

const { adminRouter } = await import('./admin.js');
const express = (await import('express')).default;
const request = (await import('supertest')).default;
const { errorHandler } = await import('../middleware/errorHandler.js');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRouter);
  app.use(errorHandler);
  return app;
}

describe('POST /api/admin/palettes/generate provider selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses gemini provider when ai_provider setting is gemini', async () => {
    const { db } = await import('../db/index.js');
    const { generatePalette } = await import('../lib/paletteGenerator.js');

    vi.mocked(db.select)
      .mockImplementationOnce(() => createQueryChain([{ key: 'ai_provider', value: 'gemini' }]) as ReturnType<typeof db.select>);

    const app = createApp();
    const res = await request(app)
      .post('/api/admin/palettes/generate')
      .set('Authorization', 'Bearer mock-token')
      .send({ hint: 'Oceanic calm' });

    expect(res.status).toBe(200);
    expect(vi.mocked(generatePalette)).toHaveBeenCalledWith('Oceanic calm', 'admin-123', 'gemini');
  });

  it('falls back to anthropic when ai_provider setting is missing', async () => {
    const { db } = await import('../db/index.js');
    const { generatePalette } = await import('../lib/paletteGenerator.js');

    vi.mocked(db.select)
      .mockImplementationOnce(() => createQueryChain([]) as ReturnType<typeof db.select>);

    const app = createApp();
    const res = await request(app)
      .post('/api/admin/palettes/generate')
      .set('Authorization', 'Bearer mock-token')
      .send({ hint: 'Terminal noir' });

    expect(res.status).toBe(200);
    expect(vi.mocked(generatePalette)).toHaveBeenCalledWith('Terminal noir', 'admin-123', 'anthropic');
  });
});

describe('GET /api/admin/onboarding/stats provider usage split', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns usageByProvider for anthropic and gemini', async () => {
    const { db } = await import('../db/index.js');

    vi.mocked(db.select)
      .mockImplementationOnce(() => createQueryChain([{ count: 4 }]) as ReturnType<typeof db.select>) // totalGenerations
      .mockImplementationOnce(() => createQueryChain([{ input: 500, output: 250 }]) as ReturnType<typeof db.select>) // totalTokens
      .mockImplementationOnce(() =>
        createQueryChain([
          { model: 'claude-sonnet-4-20250514', inputTokens: 300, outputTokens: 120 },
          { model: 'gemini-2.0-flash', inputTokens: 200, outputTokens: 130 },
          { model: 'claude-sonnet-4-20250514', inputTokens: 0, outputTokens: 0 },
        ]) as ReturnType<typeof db.select>,
      ) // tokenRows
      .mockImplementationOnce(() => createQueryChain([{ count: 2 }]) as ReturnType<typeof db.select>) // uniqueUsers
      .mockImplementationOnce(() => createQueryChain([{ count: 2 }]) as ReturnType<typeof db.select>) // plansActive
      .mockImplementationOnce(() =>
        createQueryChain([
          {
            id: 1,
            userId: 'u1',
            inputTokens: 300,
            outputTokens: 120,
            model: 'claude-sonnet-4-20250514',
            createdAt: new Date().toISOString(),
          },
        ]) as ReturnType<typeof db.select>,
      ) // recentLogs
      .mockImplementationOnce(() => createQueryChain([{ key: 'ai_onboarding_enabled', value: true }]) as ReturnType<typeof db.select>) // enabled
      .mockImplementationOnce(() => createQueryChain([{ key: 'ai_provider', value: 'gemini' }]) as ReturnType<typeof db.select>); // provider

    const app = createApp();
    const res = await request(app)
      .get('/api/admin/onboarding/stats')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(res.body.provider).toBe('gemini');
    expect(res.body.usageByProvider).toEqual({
      anthropic: { generations: 2, inputTokens: 300, outputTokens: 120 },
      gemini: { generations: 1, inputTokens: 200, outputTokens: 130 },
    });
  });
});

describe('POST /api/admin/onboarding/test-provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tests requested provider and returns health payload', async () => {
    const { generateJsonWithProvider } = await import('../lib/aiClient.js');

    const app = createApp();
    const res = await request(app)
      .post('/api/admin/onboarding/test-provider')
      .set('Authorization', 'Bearer mock-token')
      .send({ provider: 'gemini' });

    expect(res.status).toBe(200);
    expect(vi.mocked(generateJsonWithProvider)).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'gemini' }),
    );
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('provider', 'gemini');
    expect(res.body).toHaveProperty('model', 'gemini-2.5-flash');
  });
});
