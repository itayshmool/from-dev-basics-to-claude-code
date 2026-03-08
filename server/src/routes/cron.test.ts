import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock env
vi.mock('../lib/env.js', () => ({
  env: {
    CRON_SECRET: 'test-cron-secret',
  },
}));

// Mock processDigest
const mockProcessDigest = vi.fn().mockResolvedValue(3);
vi.mock('../lib/adminNotifications.js', () => ({
  processDigest: (...args: unknown[]) => mockProcessDigest(...args),
}));

const { cronRouter } = await import('./cron.js');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/cron', cronRouter);
  // Basic error handler
  app.use((err: { statusCode?: number; message: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(err.statusCode || 500).json({ error: err.message });
  });
  return app;
}

describe('POST /api/cron/digest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessDigest.mockResolvedValue(3);
  });

  it('rejects requests without cron secret', async () => {
    const app = createApp();
    const res = await request(app).post('/api/cron/digest');
    expect(res.status).toBe(401);
  });

  it('rejects requests with wrong cron secret', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/cron/digest')
      .set('x-cron-secret', 'wrong-secret');
    expect(res.status).toBe(401);
  });

  it('processes digest with valid cron secret', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/cron/digest')
      .set('x-cron-secret', 'test-cron-secret');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ processed: 3 });
    expect(mockProcessDigest).toHaveBeenCalledOnce();
  });

  it('returns processed count of 0 when queue is empty', async () => {
    mockProcessDigest.mockResolvedValue(0);
    const app = createApp();
    const res = await request(app)
      .post('/api/cron/digest')
      .set('x-cron-secret', 'test-cron-secret');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ processed: 0 });
  });
});
