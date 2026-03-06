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

// Mock DB
vi.mock('../db/index.js', () => ({
  db: {
    select: vi.fn().mockImplementation(() => createQueryChain([])),
    insert: vi.fn().mockImplementation(() => createQueryChain([])),
    update: vi.fn().mockImplementation(() => createQueryChain([])),
  },
}));

// Mock password functions
vi.mock('../lib/password.js', () => ({
  hashPassword: vi.fn().mockResolvedValue('new-hashed-pw'),
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

// Mock JWT — use a counter so each test can get a unique userId to avoid rate limit conflicts
let jwtUserIdCounter = 0;
vi.mock('../lib/jwt.js', () => ({
  signAccessToken: vi.fn().mockReturnValue('mock-access-token'),
  signRefreshToken: vi.fn().mockReturnValue('mock-refresh-token'),
  verifyAccessToken: vi.fn().mockImplementation(() => {
    jwtUserIdCounter++;
    return { userId: `user-${jwtUserIdCounter}`, role: 'student' };
  }),
  verifyRefreshToken: vi.fn().mockReturnValue({ userId: 'user-123', role: 'student' }),
}));

// Mock email service
const mockSendPasswordResetEmail = vi.fn().mockResolvedValue(undefined);
const mockSendVerificationEmail = vi.fn().mockResolvedValue(undefined);
const mockVerifyEmailToken = vi.fn().mockResolvedValue({ success: true, userId: 'user-123' });
const mockVerifyPasswordResetToken = vi.fn().mockResolvedValue({ success: true, userId: 'user-123', tokenId: 'token-1' });
const mockMarkPasswordResetTokenUsed = vi.fn().mockResolvedValue(undefined);

vi.mock('../lib/email.js', () => ({
  sendPasswordResetEmail: (...args: unknown[]) => mockSendPasswordResetEmail(...args),
  sendVerificationEmail: (...args: unknown[]) => mockSendVerificationEmail(...args),
  verifyEmailToken: (...args: unknown[]) => mockVerifyEmailToken(...args),
  verifyPasswordResetToken: (...args: unknown[]) => mockVerifyPasswordResetToken(...args),
  markPasswordResetTokenUsed: (...args: unknown[]) => mockMarkPasswordResetTokenUsed(...args),
}));

const { emailRouter } = await import('./email.js');
const express = (await import('express')).default;
const cookieParser = (await import('cookie-parser')).default;
const request = (await import('supertest')).default;
const { errorHandler } = await import('../middleware/errorHandler.js');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/email', emailRouter);
  app.use(errorHandler);
  return app;
}

describe('POST /api/email/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 { ok: true } for valid user with email', async () => {
    const { db } = await import('../db/index.js');
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([{ id: 'user-1', email: 'alice@example.com', displayName: 'Alice' }]) as ReturnType<typeof db.select>
    );

    const app = createApp();
    const res = await request(app)
      .post('/api/email/forgot-password')
      .send({ username: 'alice' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    // Password reset email should be triggered
    // (fire-and-forget, so just check it doesn't throw)
  });

  it('returns 200 { ok: true } for unknown user (no enumeration)', async () => {
    const { db } = await import('../db/index.js');
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([]) as ReturnType<typeof db.select>
    );

    const app = createApp();
    const res = await request(app)
      .post('/api/email/forgot-password')
      .send({ username: 'nonexistent' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('returns 400 for missing username', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/email/forgot-password')
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 429 after exceeding rate limit', async () => {
    const { db } = await import('../db/index.js');
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([]) as ReturnType<typeof db.select>
    );

    const app = createApp();

    // Make 3 requests (the limit)
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/email/forgot-password')
        .set('X-Forwarded-For', '1.2.3.4')
        .send({ username: 'rate_limited_user' });
    }

    // 4th should be rate limited
    const res = await request(app)
      .post('/api/email/forgot-password')
      .set('X-Forwarded-For', '1.2.3.4')
      .send({ username: 'rate_limited_user' });

    expect(res.status).toBe(429);
  });
});

describe('POST /api/email/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resets password with valid token', async () => {
    mockVerifyPasswordResetToken.mockResolvedValue({ success: true, userId: 'user-1', tokenId: 'token-1' });

    const { db } = await import('../db/index.js');
    vi.mocked(db.update).mockImplementation(() =>
      createQueryChain([]) as ReturnType<typeof db.update>
    );

    const app = createApp();
    const res = await request(app)
      .post('/api/email/reset-password')
      .send({
        token: 'a'.repeat(64),
        newPassword: 'newpassword123',
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(mockMarkPasswordResetTokenUsed).toHaveBeenCalledWith('token-1');
  });

  it('returns 400 for expired token', async () => {
    mockVerifyPasswordResetToken.mockResolvedValue({ success: false, error: 'Invalid or expired reset link' });

    const app = createApp();
    const res = await request(app)
      .post('/api/email/reset-password')
      .send({
        token: 'b'.repeat(64),
        newPassword: 'newpassword123',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid or expired');
  });

  it('returns 400 for short password', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/email/reset-password')
      .send({
        token: 'c'.repeat(64),
        newPassword: 'short',
      });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/email/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('verifies email with valid token', async () => {
    mockVerifyEmailToken.mockResolvedValue({ success: true, userId: 'user-1' });

    const app = createApp();
    const res = await request(app)
      .post('/api/email/verify')
      .send({ token: 'd'.repeat(64) });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('returns 400 for expired token', async () => {
    mockVerifyEmailToken.mockResolvedValue({ success: false, error: 'Invalid or expired verification link' });

    const app = createApp();
    const res = await request(app)
      .post('/api/email/verify')
      .send({ token: 'e'.repeat(64) });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid or expired');
  });

  it('returns 400 for invalid token format', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/email/verify')
      .send({ token: 'too-short' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/email/resend-verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without auth token', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/email/resend-verification');

    expect(res.status).toBe(401);
  });

  it('sends verification email for authenticated user with email', async () => {
    const { db } = await import('../db/index.js');
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([{
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: false,
      }]) as ReturnType<typeof db.select>
    );

    const app = createApp();
    const res = await request(app)
      .post('/api/email/resend-verification')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('returns 400 when no email on account', async () => {
    const { db } = await import('../db/index.js');
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([{
        id: 'user-123',
        email: null,
        displayName: 'Test User',
        emailVerified: false,
      }]) as ReturnType<typeof db.select>
    );

    const app = createApp();
    const res = await request(app)
      .post('/api/email/resend-verification')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(400);
  });

  it('returns 400 when email already verified', async () => {
    const { db } = await import('../db/index.js');
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([{
        id: 'user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        emailVerified: true,
      }]) as ReturnType<typeof db.select>
    );

    const app = createApp();
    const res = await request(app)
      .post('/api/email/resend-verification')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(400);
  });
});
