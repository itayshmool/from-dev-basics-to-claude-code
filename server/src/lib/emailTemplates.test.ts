import { describe, it, expect } from 'vitest';
import {
  welcomeTemplate,
  verificationTemplate,
  passwordResetTemplate,
  bugSubmittedTemplate,
} from './emailTemplates.js';

describe('welcomeTemplate', () => {
  it('contains display name and app URL', () => {
    const html = welcomeTemplate('Alice', 'https://zero2claude.dev');
    expect(html).toContain('Alice');
    expect(html).toContain('https://zero2claude.dev');
    expect(html).toContain('Start Learning');
  });
});

describe('verificationTemplate', () => {
  it('contains display name and verify URL', () => {
    const html = verificationTemplate('Bob', 'https://zero2claude.dev/verify-email?token=abc123');
    expect(html).toContain('Bob');
    expect(html).toContain('https://zero2claude.dev/verify-email?token=abc123');
    expect(html).toContain('Verify Email');
  });
});

describe('passwordResetTemplate', () => {
  it('contains display name and reset URL', () => {
    const html = passwordResetTemplate('Charlie', 'https://zero2claude.dev/reset-password?token=xyz789');
    expect(html).toContain('Charlie');
    expect(html).toContain('https://zero2claude.dev/reset-password?token=xyz789');
    expect(html).toContain('Reset Password');
  });
});

describe('bugSubmittedTemplate', () => {
  it('contains display name and issue number', () => {
    const html = bugSubmittedTemplate('Dave', 42);
    expect(html).toContain('Dave');
    expect(html).toContain('#42');
    expect(html).toContain('Bug report received');
  });
});
