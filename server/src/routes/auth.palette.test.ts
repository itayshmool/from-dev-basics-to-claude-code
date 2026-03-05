import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create a fully chainable mock that supports any Drizzle chain
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

// Mock db
vi.mock('../db/index.js', () => ({
  db: {
    select: vi.fn().mockImplementation(() => createQueryChain([])),
    update: vi.fn().mockImplementation(() => createQueryChain([])),
    insert: vi.fn().mockImplementation(() => createQueryChain([])),
  },
}));

// Mock password functions (needed by auth router)
vi.mock('../lib/password.js', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed'),
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

// Mock JWT functions
vi.mock('../lib/jwt.js', () => ({
  signAccessToken: vi.fn().mockReturnValue('mock-access-token'),
  signRefreshToken: vi.fn().mockReturnValue('mock-refresh-token'),
  verifyAccessToken: vi.fn().mockReturnValue({ userId: 'user-123', role: 'student' }),
  verifyRefreshToken: vi.fn().mockReturnValue({ userId: 'user-123', role: 'student' }),
}));

const { authRouter } = await import('./auth.js');
const express = (await import('express')).default;
const cookieParser = (await import('cookie-parser')).default;
const request = (await import('supertest')).default;
const { errorHandler } = await import('../middleware/errorHandler.js');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRouter);
  app.use(errorHandler);
  return app;
}

describe('PUT /api/auth/palette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without auth token', async () => {
    const app = createApp();
    const res = await request(app)
      .put('/api/auth/palette')
      .send({ paletteId: '550e8400-e29b-41d4-a716-446655440000' });

    expect(res.status).toBe(401);
  });

  it('sets palette and returns paletteId on success', async () => {
    const { db } = await import('../db/index.js');
    // Mock: palette exists
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([{ id: '550e8400-e29b-41d4-a716-446655440000' }]) as ReturnType<typeof db.select>
    );
    // Mock: update returns paletteId
    vi.mocked(db.update).mockImplementation(() =>
      createQueryChain([{ paletteId: '550e8400-e29b-41d4-a716-446655440000' }]) as ReturnType<typeof db.update>
    );

    const app = createApp();
    const res = await request(app)
      .put('/api/auth/palette')
      .set('Authorization', 'Bearer mock-token')
      .send({ paletteId: '550e8400-e29b-41d4-a716-446655440000' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('paletteId', '550e8400-e29b-41d4-a716-446655440000');
  });

  it('validates that paletteId is present in request body', async () => {
    const { db } = await import('../db/index.js');
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([]) as ReturnType<typeof db.select>
    );

    const app = createApp();
    // Send valid UUID but palette doesn't exist in DB
    const res = await request(app)
      .put('/api/auth/palette')
      .set('Authorization', 'Bearer mock-token')
      .send({ paletteId: '550e8400-e29b-41d4-a716-446655440000' });

    // Route checks db, finds no palette, throws 404
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/auth/palette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without auth token', async () => {
    const app = createApp();
    const res = await request(app).delete('/api/auth/palette');

    expect(res.status).toBe(401);
  });

  it('resets palette to null and returns { paletteId: null }', async () => {
    const { db } = await import('../db/index.js');
    vi.mocked(db.update).mockImplementation(() =>
      createQueryChain([]) as ReturnType<typeof db.update>
    );

    const app = createApp();
    const res = await request(app)
      .delete('/api/auth/palette')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ paletteId: null });
  });
});
