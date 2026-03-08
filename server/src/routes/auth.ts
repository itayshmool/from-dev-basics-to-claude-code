import { Router } from 'express';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users, palettes } from '../db/schema.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth, blockIfImpersonating } from '../middleware/auth.js';
import { sendWelcomeEmail, sendVerificationEmail } from '../lib/email.js';
import { recordAdminEvent } from '../lib/adminNotifications.js';

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
  username: z.string()
    .trim()
    .min(3, 'Username must be 3–100 characters and use only letters, numbers, and underscores.')
    .max(100, 'Username must be 3–100 characters and use only letters, numbers, and underscores.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username must be 3–100 characters and use only letters, numbers, and underscores.')
    .transform((v) => v.toLowerCase()),
  password: z.string()
    .min(8, 'Password must be at least 8 characters and include at least 1 letter and 1 number.')
    .max(128, 'Password is too long. Maximum is 128 characters.')
    .regex(/[A-Za-z]/, 'Password must be at least 8 characters and include at least 1 letter and 1 number.')
    .regex(/[0-9]/, 'Password must be at least 8 characters and include at least 1 letter and 1 number.'),
  displayName: z.string()
    .trim()
    .min(1, 'Display name cannot be empty or whitespace.')
    .max(100, 'Display name must be 100 characters or fewer.'),
  email: z.string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address.')
    .max(255, 'Enter a valid email address.'),
}).superRefine((data, ctx) => {
  const passwordLower = data.password.toLowerCase();
  if (
    passwordLower.includes(data.username.toLowerCase()) ||
    passwordLower.includes(data.email.toLowerCase())
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['password'],
      message: 'Password cannot contain your username or email.',
    });
  }
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// POST /api/auth/register
authRouter.post('/register', asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.issues.map(i => i.message).join(', '));
  }

  const { username, password, displayName, email } = parsed.data;

  // Check for existing user
  const [existing] = await db.select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.username}) = ${username}`)
    .limit(1);

  if (existing) {
    throw new AppError(409, 'Username is not available.');
  }

  const [existingEmail] = await db.select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);

  if (existingEmail) {
    throw new AppError(409, 'An account with this email already exists.');
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db.insert(users).values({
    username,
    passwordHash,
    displayName,
    role: 'student',
    email: email ?? null,
  }).returning({
    id: users.id,
    username: users.username,
    displayName: users.displayName,
    role: users.role,
    paletteId: users.paletteId,
  });

  // Fire-and-forget welcome + verification emails
  if (email) {
    sendWelcomeEmail(user.id, email, displayName).catch(() => {});
    sendVerificationEmail(user.id, email, displayName).catch(() => {});
  }

  // Fire-and-forget admin notification
  recordAdminEvent('student_joined', { displayName, email: email ?? null }).catch(() => {});

  const payload = { userId: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
  res.status(201).json({
    user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role, paletteId: user.paletteId },
    accessToken,
  });
}));

// POST /api/auth/login
authRouter.post('/login', asyncHandler(async (req, res) => {
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
    user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role, paletteId: user.paletteId },
    accessToken,
  });
}));

// POST /api/auth/refresh
authRouter.post('/refresh', asyncHandler(async (req, res) => {
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
    paletteId: users.paletteId,
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
    user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role, paletteId: user.paletteId },
    accessToken,
  });
}));

// POST /api/auth/logout
authRouter.post('/logout', (_req, res) => {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.json({ ok: true });
});

// GET /api/auth/me — full profile with createdAt, email, profileImage
authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const [user] = await db.select({
    id: users.id,
    username: users.username,
    displayName: users.displayName,
    role: users.role,
    email: users.email,
    emailVerified: users.emailVerified,
    profileImage: users.profileImage,
    paletteId: users.paletteId,
    createdAt: users.createdAt,
  }).from(users)
    .where(eq(users.id, req.user!.userId))
    .limit(1);

  if (!user) throw new AppError(404, 'User not found');
  res.json(user);
}));

// PUT /api/auth/profile — update display name and/or email
const profileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).nullable().optional(),
});

authRouter.put('/profile', requireAuth, asyncHandler(async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, parsed.error.issues.map(i => i.message).join(', '));

  const updates: Record<string, unknown> = {};
  if (parsed.data.displayName !== undefined) updates.displayName = parsed.data.displayName;
  if (parsed.data.email !== undefined) {
    updates.email = parsed.data.email;
    // Reset verification when email changes
    if (parsed.data.email !== null) {
      updates.emailVerified = false;
      updates.emailVerifiedAt = null;
    }
  }

  if (Object.keys(updates).length === 0) throw new AppError(400, 'No updates provided');

  const [user] = await db.update(users)
    .set(updates)
    .where(eq(users.id, req.user!.userId))
    .returning({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      email: users.email,
      role: users.role,
    });

  if (!user) throw new AppError(404, 'User not found');

  // Send verification email for the new email address
  if (parsed.data.email && user.email) {
    sendVerificationEmail(user.id, user.email, user.displayName).catch(() => {});
  }

  res.json(user);
}));

// PUT /api/auth/profile-image — upload profile image as base64
const profileImageSchema = z.object({
  image: z.string().max(5_000_000),
});

authRouter.put('/profile-image', requireAuth, blockIfImpersonating, asyncHandler(async (req, res) => {
  const parsed = profileImageSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'Invalid image data');

  const { image } = parsed.data;

  // Validate it's a data URI with allowed mime type
  const dataUriMatch = image.match(/^data:image\/(jpeg|png|gif|webp);base64,/);
  if (!dataUriMatch) {
    throw new AppError(400, 'Image must be a base64-encoded JPEG, PNG, GIF, or WebP');
  }

  // Check decoded size (base64 is ~4/3 of original)
  const base64Part = image.split(',')[1];
  const estimatedBytes = (base64Part.length * 3) / 4;
  if (estimatedBytes > 2 * 1024 * 1024) {
    throw new AppError(400, 'Image must be under 2MB');
  }

  const [user] = await db.update(users)
    .set({ profileImage: image })
    .where(eq(users.id, req.user!.userId))
    .returning({
      id: users.id,
      profileImage: users.profileImage,
    });

  if (!user) throw new AppError(404, 'User not found');
  res.json({ profileImage: user.profileImage });
}));

// DELETE /api/auth/profile-image — remove profile image
authRouter.delete('/profile-image', requireAuth, blockIfImpersonating, asyncHandler(async (req, res) => {
  await db.update(users)
    .set({ profileImage: null })
    .where(eq(users.id, req.user!.userId));

  res.json({ ok: true });
}));

// PUT /api/auth/palette — set user's palette preference
const paletteSchema = z.object({
  paletteId: z.string().uuid(),
});

authRouter.put('/palette', requireAuth, asyncHandler(async (req, res) => {
  const parsed = paletteSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'Invalid palette ID');

  // Verify palette exists and is active
  const [palette] = await db.select({ id: palettes.id })
    .from(palettes)
    .where(eq(palettes.id, parsed.data.paletteId))
    .limit(1);

  if (!palette) throw new AppError(404, 'Palette not found');

  const [user] = await db.update(users)
    .set({ paletteId: parsed.data.paletteId })
    .where(eq(users.id, req.user!.userId))
    .returning({ paletteId: users.paletteId });

  if (!user) throw new AppError(404, 'User not found');
  res.json({ paletteId: user.paletteId });
}));

// DELETE /api/auth/palette — reset to default
authRouter.delete('/palette', requireAuth, asyncHandler(async (req, res) => {
  await db.update(users)
    .set({ paletteId: null })
    .where(eq(users.id, req.user!.userId));

  res.json({ paletteId: null });
}));

// PUT /api/auth/password — change password
const passwordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

authRouter.put('/password', requireAuth, blockIfImpersonating, asyncHandler(async (req, res) => {
  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'Invalid input. New password must be at least 8 characters.');

  const [user] = await db.select()
    .from(users)
    .where(eq(users.id, req.user!.userId))
    .limit(1);

  if (!user) throw new AppError(404, 'User not found');

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) throw new AppError(401, 'Current password is incorrect');

  const newHash = await hashPassword(parsed.data.newPassword);
  await db.update(users)
    .set({ passwordHash: newHash })
    .where(eq(users.id, user.id));

  res.json({ ok: true });
}));
