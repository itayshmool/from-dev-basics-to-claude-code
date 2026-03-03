import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';
import { AppError } from '../middleware/errorHandler.js';

export const authRouter = Router();

const REFRESH_COOKIE = 'refreshToken';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'none' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth',
};

const registerSchema = z.object({
  username: z.string().min(3).max(100).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8),
  displayName: z.string().min(1).max(100),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// POST /api/auth/register
authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues.map(i => i.message).join(', '));
  }

  const { username, password, displayName } = parsed.data;

  // Check for existing user
  const [existing] = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existing) {
    throw new AppError(409, 'Username already taken');
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db.insert(users).values({
    username,
    passwordHash,
    displayName,
    role: 'student',
  }).returning({
    id: users.id,
    username: users.username,
    displayName: users.displayName,
    role: users.role,
  });

  const payload = { userId: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
  res.status(201).json({
    user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role },
    accessToken,
  });
});

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'Username and password required');
  }

  const { username, password } = parsed.data;

  const [user] = await db.select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new AppError(401, 'Invalid credentials');
  }

  const payload = { userId: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
  res.json({
    user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role },
    accessToken,
  });
});

// POST /api/auth/refresh
authRouter.post('/refresh', async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) {
    throw new AppError(401, 'No refresh token');
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    throw new AppError(401, 'Invalid refresh token');
  }

  // Verify user still exists
  const [user] = await db.select({
    id: users.id,
    username: users.username,
    displayName: users.displayName,
    role: users.role,
  }).from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  if (!user) {
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    throw new AppError(401, 'User not found');
  }

  const newPayload = { userId: user.id, role: user.role };
  const accessToken = signAccessToken(newPayload);
  const refreshToken = signRefreshToken(newPayload);

  res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
  res.json({
    user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role },
    accessToken,
  });
});

// POST /api/auth/logout
authRouter.post('/logout', (_req, res) => {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.json({ ok: true });
});
