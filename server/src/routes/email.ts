import { Router } from 'express';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { hashPassword } from '../lib/password.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
  verifyEmailToken,
  verifyPasswordResetToken,
  markPasswordResetTokenUsed,
} from '../lib/email.js';

export const emailRouter = Router();

// ---------------------------------------------------------------------------
// Rate limiting (in-memory, same pattern as bugReports.ts)
// ---------------------------------------------------------------------------

const forgotPasswordTimestamps = new Map<string, number[]>();
const FORGOT_WINDOW = 15 * 60 * 1000; // 15 min
const FORGOT_MAX = 3;

const resendVerificationTimestamps = new Map<string, number>();
const RESEND_WINDOW = 5 * 60 * 1000; // 5 min

function checkForgotRateLimit(key: string): void {
  const now = Date.now();
  const timestamps = (forgotPasswordTimestamps.get(key) || []).filter(t => now - t < FORGOT_WINDOW);
  if (timestamps.length >= FORGOT_MAX) {
    throw new AppError(429, 'Too many requests. Please try again later.');
  }
  timestamps.push(now);
  forgotPasswordTimestamps.set(key, timestamps);
}

function checkResendRateLimit(userId: string): void {
  const last = resendVerificationTimestamps.get(userId);
  if (last && Date.now() - last < RESEND_WINDOW) {
    throw new AppError(429, 'Please wait a few minutes before requesting another verification email.');
  }
  resendVerificationTimestamps.set(userId, Date.now());
}

// ---------------------------------------------------------------------------
// POST /api/email/forgot-password
// ---------------------------------------------------------------------------

const forgotPasswordSchema = z.object({
  username: z.string().min(1),
});

emailRouter.post('/forgot-password', asyncHandler(async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'Username is required');
  }

  const { username } = parsed.data;
  const ip = (req.headers['x-forwarded-for'] as string | undefined) || req.socket.remoteAddress || '';
  const rateLimitKey = `${username}:${ip}`;
  checkForgotRateLimit(rateLimitKey);

  // Always return ok (no user enumeration)
  const [user] = await db.select({
    id: users.id,
    email: users.email,
    displayName: users.displayName,
  }).from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (user?.email) {
    // Fire-and-forget — don't await in the response path
    sendPasswordResetEmail(user.id, user.email, user.displayName).catch(() => {});
  }

  res.json({ ok: true });
}));

// ---------------------------------------------------------------------------
// POST /api/email/reset-password
// ---------------------------------------------------------------------------

const resetPasswordSchema = z.object({
  token: z.string().length(64),
  newPassword: z.string().min(8),
});

emailRouter.post('/reset-password', asyncHandler(async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'Invalid request. Password must be at least 8 characters.');
  }

  const result = await verifyPasswordResetToken(parsed.data.token);
  if (!result.success) {
    throw new AppError(400, result.error);
  }

  // Update password
  const newHash = await hashPassword(parsed.data.newPassword);
  await db.update(users)
    .set({ passwordHash: newHash })
    .where(eq(users.id, result.userId));

  // Mark token used
  await markPasswordResetTokenUsed(result.tokenId);

  res.json({ ok: true });
}));

// ---------------------------------------------------------------------------
// POST /api/email/verify
// ---------------------------------------------------------------------------

const verifySchema = z.object({
  token: z.string().length(64),
});

emailRouter.post('/verify', asyncHandler(async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'Invalid verification token');
  }

  const result = await verifyEmailToken(parsed.data.token);
  if (!result.success) {
    throw new AppError(400, result.error);
  }

  res.json({ ok: true });
}));

// ---------------------------------------------------------------------------
// POST /api/email/resend-verification
// ---------------------------------------------------------------------------

emailRouter.post('/resend-verification', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  checkResendRateLimit(userId);

  const [user] = await db.select({
    id: users.id,
    email: users.email,
    displayName: users.displayName,
    emailVerified: users.emailVerified,
  }).from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) throw new AppError(404, 'User not found');
  if (!user.email) throw new AppError(400, 'No email address on your account');
  if (user.emailVerified) throw new AppError(400, 'Email is already verified');

  await sendVerificationEmail(user.id, user.email, user.displayName);
  res.json({ ok: true });
}));
