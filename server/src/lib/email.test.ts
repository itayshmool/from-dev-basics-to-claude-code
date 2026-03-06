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

// Mock env
vi.mock('./env.js', () => ({
  env: {
    RESEND_API_KEY: 'test_resend_key',
    FRONTEND_URL: 'https://zero2claude.dev',
  },
}));

// Mock Resend
const mockSend = vi.fn().mockResolvedValue({ data: { id: 're_test123' }, error: null });
vi.mock('resend', () => {
  return {
    Resend: class MockResend {
      emails = { send: mockSend };
    },
  };
});

const { generateToken, hashToken, sendAndLog, getEmailSettings, sendWelcomeEmail } = await import('./email.js');

describe('generateToken', () => {
  it('returns a 64-char hex string', () => {
    const token = generateToken();
    expect(token).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(token)).toBe(true);
  });

  it('generates unique tokens', () => {
    const t1 = generateToken();
    const t2 = generateToken();
    expect(t1).not.toBe(t2);
  });
});

describe('hashToken', () => {
  it('returns consistent SHA-256 hash', () => {
    const token = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const h1 = hashToken(token);
    const h2 = hashToken(token);
    expect(h1).toBe(h2);
  });

  it('returns a different string than the input', () => {
    const token = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const hash = hashToken(token);
    expect(hash).not.toBe(token);
  });

  it('returns a 64-char hex string', () => {
    const hash = hashToken('test');
    expect(hash).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
  });
});

describe('getEmailSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns defaults when no DB row exists', async () => {
    const { db } = await import('../db/index.js');
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([]) as ReturnType<typeof db.select>
    );

    const settings = await getEmailSettings();
    expect(settings.welcome.enabled).toBe(true);
    expect(settings.welcome.subject).toBe('Welcome to From Zero to Claude Code');
    expect(settings.verification.enabled).toBe(true);
    expect(settings.password_reset.enabled).toBe(true);
    expect(settings.bug_submitted.enabled).toBe(true);
  });

  it('merges DB overrides with defaults', async () => {
    const { db } = await import('../db/index.js');
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([{
        key: 'email_settings',
        value: {
          welcome: { enabled: false, subject: 'Custom Welcome' },
        },
      }]) as ReturnType<typeof db.select>
    );

    const settings = await getEmailSettings();
    expect(settings.welcome.enabled).toBe(false);
    expect(settings.welcome.subject).toBe('Custom Welcome');
    // Others keep defaults
    expect(settings.verification.enabled).toBe(true);
    expect(settings.password_reset.enabled).toBe(true);
  });
});

describe('sendAndLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: 're_test123' }, error: null });
  });

  it('sends email via Resend and logs to DB', async () => {
    const { db } = await import('../db/index.js');
    vi.mocked(db.insert).mockImplementation(() => createQueryChain([]) as ReturnType<typeof db.insert>);

    await sendAndLog({
      emailType: 'welcome',
      to: 'alice@example.com',
      subject: 'Test Subject',
      html: '<p>Test</p>',
      userId: 'user-123',
    });

    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      to: 'alice@example.com',
      subject: 'Test Subject',
    }));
    expect(db.insert).toHaveBeenCalled();
  });

  it('handles Resend errors without throwing', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'Invalid API key' } });

    const { db } = await import('../db/index.js');
    vi.mocked(db.insert).mockImplementation(() => createQueryChain([]) as ReturnType<typeof db.insert>);

    // Should not throw
    await sendAndLog({
      emailType: 'welcome',
      to: 'alice@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
    });

    expect(db.insert).toHaveBeenCalled();
  });
});

describe('sendWelcomeEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: 're_test456' }, error: null });
  });

  it('sends when welcome is enabled', async () => {
    const { db } = await import('../db/index.js');
    // getEmailSettings returns defaults (enabled)
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([]) as ReturnType<typeof db.select>
    );
    vi.mocked(db.insert).mockImplementation(() =>
      createQueryChain([]) as ReturnType<typeof db.insert>
    );

    await sendWelcomeEmail('user-1', 'test@example.com', 'Alice');
    expect(mockSend).toHaveBeenCalled();
  });

  it('skips when welcome is disabled', async () => {
    const { db } = await import('../db/index.js');
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([{
        key: 'email_settings',
        value: { welcome: { enabled: false, subject: 'Welcome' } },
      }]) as ReturnType<typeof db.select>
    );

    await sendWelcomeEmail('user-1', 'test@example.com', 'Alice');
    expect(mockSend).not.toHaveBeenCalled();
  });
});
