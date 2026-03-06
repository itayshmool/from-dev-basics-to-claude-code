import crypto from 'node:crypto';
import { Resend } from 'resend';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, emailVerificationTokens, passwordResetTokens, emailLog, siteSettings } from '../db/schema.js';
import { env } from './env.js';
import {
  welcomeTemplate,
  verificationTemplate,
  passwordResetTemplate,
  bugSubmittedTemplate,
} from './emailTemplates.js';

// ---------------------------------------------------------------------------
// Resend client (lazy — null when no API key configured)
// ---------------------------------------------------------------------------

let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!resend) {
    resend = new Resend(env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_ADDRESS = env.EMAIL_FROM;

// ---------------------------------------------------------------------------
// Token utilities
// ---------------------------------------------------------------------------

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ---------------------------------------------------------------------------
// Email settings
// ---------------------------------------------------------------------------

export interface EmailTypeSettings {
  enabled: boolean;
  subject: string;
}

export interface EmailSettings {
  welcome: EmailTypeSettings;
  verification: EmailTypeSettings;
  password_reset: EmailTypeSettings;
  bug_submitted: EmailTypeSettings;
}

const DEFAULT_SETTINGS: EmailSettings = {
  welcome: { enabled: true, subject: 'Welcome to From Zero to Claude Code' },
  verification: { enabled: true, subject: 'Verify your email' },
  password_reset: { enabled: true, subject: 'Reset your password' },
  bug_submitted: { enabled: true, subject: 'Bug report received' },
};

export async function getEmailSettings(): Promise<EmailSettings> {
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, 'email_settings'));
  if (!row) return { ...DEFAULT_SETTINGS };
  const stored = row.value as Partial<EmailSettings>;
  return {
    welcome: { ...DEFAULT_SETTINGS.welcome, ...stored.welcome },
    verification: { ...DEFAULT_SETTINGS.verification, ...stored.verification },
    password_reset: { ...DEFAULT_SETTINGS.password_reset, ...stored.password_reset },
    bug_submitted: { ...DEFAULT_SETTINGS.bug_submitted, ...stored.bug_submitted },
  };
}

// ---------------------------------------------------------------------------
// Core send + log
// ---------------------------------------------------------------------------

interface SendParams {
  emailType: string;
  to: string;
  subject: string;
  html: string;
  userId?: string;
}

export async function sendAndLog(params: SendParams): Promise<void> {
  const client = getResendClient();
  let resendId: string | null = null;
  let status: 'sent' | 'failed' = 'sent';
  let errorMessage: string | null = null;

  if (!client) {
    status = 'failed';
    errorMessage = 'Resend API key not configured';
  } else {
    try {
      const result = await client.emails.send({
        from: FROM_ADDRESS,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
      if (result.error) {
        status = 'failed';
        errorMessage = result.error.message;
      } else {
        resendId = result.data?.id ?? null;
      }
    } catch (err) {
      status = 'failed';
      errorMessage = err instanceof Error ? err.message : String(err);
    }
  }

  // Log to DB — never throw
  try {
    await db.insert(emailLog).values({
      emailType: params.emailType,
      recipientEmail: params.to,
      recipientUserId: params.userId ?? null,
      subject: params.subject,
      resendId,
      status,
      errorMessage,
    });
  } catch (logErr) {
    console.error('Failed to log email:', logErr);
  }
}

// ---------------------------------------------------------------------------
// Public send functions (fire-and-forget, never throw)
// ---------------------------------------------------------------------------

export async function sendWelcomeEmail(userId: string, email: string, displayName: string): Promise<void> {
  try {
    const settings = await getEmailSettings();
    if (!settings.welcome.enabled) return;
    const html = welcomeTemplate(displayName, env.FRONTEND_URL);
    await sendAndLog({
      emailType: 'welcome',
      to: email,
      subject: settings.welcome.subject,
      html,
      userId,
    });
  } catch (err) {
    console.error('sendWelcomeEmail error:', err);
  }
}

export async function sendVerificationEmail(userId: string, email: string, displayName: string): Promise<void> {
  try {
    const settings = await getEmailSettings();
    if (!settings.verification.enabled) return;

    // Invalidate previous unused tokens for this user
    await db.update(emailVerificationTokens)
      .set({ usedAt: new Date() })
      .where(and(
        eq(emailVerificationTokens.userId, userId),
        isNull(emailVerificationTokens.usedAt),
      ));

    const token = generateToken();
    const tokenH = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(emailVerificationTokens).values({
      userId,
      email,
      tokenHash: tokenH,
      expiresAt,
    });

    const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;
    const html = verificationTemplate(displayName, verifyUrl);
    await sendAndLog({
      emailType: 'verification',
      to: email,
      subject: settings.verification.subject,
      html,
      userId,
    });
  } catch (err) {
    console.error('sendVerificationEmail error:', err);
  }
}

export async function sendPasswordResetEmail(userId: string, email: string, displayName: string): Promise<void> {
  try {
    const settings = await getEmailSettings();
    if (!settings.password_reset.enabled) return;

    // Invalidate previous unused tokens for this user
    await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(and(
        eq(passwordResetTokens.userId, userId),
        isNull(passwordResetTokens.usedAt),
      ));

    const token = generateToken();
    const tokenH = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.insert(passwordResetTokens).values({
      userId,
      tokenHash: tokenH,
      expiresAt,
    });

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = passwordResetTemplate(displayName, resetUrl);
    await sendAndLog({
      emailType: 'password_reset',
      to: email,
      subject: settings.password_reset.subject,
      html,
      userId,
    });
  } catch (err) {
    console.error('sendPasswordResetEmail error:', err);
  }
}

export async function sendBugSubmittedEmail(userId: string, email: string, displayName: string, issueNumber: number): Promise<void> {
  try {
    const settings = await getEmailSettings();
    if (!settings.bug_submitted.enabled) return;

    const html = bugSubmittedTemplate(displayName, issueNumber);
    await sendAndLog({
      emailType: 'bug_submitted',
      to: email,
      subject: settings.bug_submitted.subject,
      html,
      userId,
    });
  } catch (err) {
    console.error('sendBugSubmittedEmail error:', err);
  }
}

// ---------------------------------------------------------------------------
// Token verification helpers (used by routes)
// ---------------------------------------------------------------------------

export async function verifyEmailToken(rawToken: string): Promise<{ success: true; userId: string } | { success: false; error: string }> {
  const tokenH = hashToken(rawToken);

  const [row] = await db.select()
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.tokenHash, tokenH))
    .limit(1);

  if (!row) return { success: false, error: 'Invalid or expired verification link' };
  if (row.usedAt) return { success: false, error: 'Invalid or expired verification link' };
  if (new Date() > row.expiresAt) return { success: false, error: 'Invalid or expired verification link' };

  // Mark used
  await db.update(emailVerificationTokens)
    .set({ usedAt: new Date() })
    .where(eq(emailVerificationTokens.id, row.id));

  // Set emailVerified on user
  await db.update(users)
    .set({ emailVerified: true, emailVerifiedAt: new Date() })
    .where(eq(users.id, row.userId));

  return { success: true, userId: row.userId };
}

export async function verifyPasswordResetToken(rawToken: string): Promise<{ success: true; userId: string; tokenId: string } | { success: false; error: string }> {
  const tokenH = hashToken(rawToken);

  const [row] = await db.select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, tokenH))
    .limit(1);

  if (!row) return { success: false, error: 'Invalid or expired reset link' };
  if (row.usedAt) return { success: false, error: 'Invalid or expired reset link' };
  if (new Date() > row.expiresAt) return { success: false, error: 'Invalid or expired reset link' };

  return { success: true, userId: row.userId, tokenId: row.id };
}

export async function markPasswordResetTokenUsed(tokenId: string): Promise<void> {
  await db.update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, tokenId));
}
