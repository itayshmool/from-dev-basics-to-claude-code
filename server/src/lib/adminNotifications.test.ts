import { describe, it, expect, vi, beforeEach } from 'vitest';

// Chainable mock that resolves to `result` at the end of any Drizzle chain
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

// Track insert values for assertions
const insertedValues: unknown[] = [];
const updatedSets: unknown[] = [];

vi.mock('../db/index.js', () => ({
  db: {
    select: vi.fn().mockImplementation(() => createQueryChain([])),
    insert: vi.fn().mockImplementation(() => {
      const chain = {
        values: vi.fn().mockImplementation((v: unknown) => {
          insertedValues.push(v);
          return {
            onConflictDoUpdate: vi.fn().mockReturnValue(createQueryChain([])),
            then: (resolve: (v: unknown) => void) => resolve([]),
          };
        }),
      };
      return chain;
    }),
    update: vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation((v: unknown) => {
        updatedSets.push(v);
        return createQueryChain([]);
      }),
    })),
  },
}));

vi.mock('./env.js', () => ({
  env: {
    RESEND_API_KEY: 'test_key',
    FRONTEND_URL: 'https://zero2claude.dev',
  },
}));

const mockSendAndLog = vi.fn().mockResolvedValue(undefined);
vi.mock('./email.js', () => ({
  sendAndLog: (...args: unknown[]) => mockSendAndLog(...args),
}));

const {
  getAdminNotificationConfig,
  recordAdminEvent,
  processDigest,
} = await import('./adminNotifications.js');

describe('getAdminNotificationConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns defaults when no DB row exists', async () => {
    const { db } = await import('../db/index.js');
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([]) as ReturnType<typeof db.select>
    );

    const config = await getAdminNotificationConfig();
    expect(config.recipients).toEqual([]);
    expect(config.events.student_joined).toEqual({ enabled: true, mode: 'digest' });
    expect(config.events.bug_report).toEqual({ enabled: true, mode: 'immediate' });
  });

  it('merges stored config with defaults', async () => {
    const { db } = await import('../db/index.js');
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([{
        key: 'admin_notifications',
        value: {
          recipients: ['admin@test.com'],
          events: { bug_report: { enabled: false, mode: 'digest' } },
        },
      }]) as ReturnType<typeof db.select>
    );

    const config = await getAdminNotificationConfig();
    expect(config.recipients).toEqual(['admin@test.com']);
    expect(config.events.bug_report).toEqual({ enabled: false, mode: 'digest' });
    // student_joined keeps default
    expect(config.events.student_joined).toEqual({ enabled: true, mode: 'digest' });
  });
});

describe('recordAdminEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertedValues.length = 0;
    mockSendAndLog.mockResolvedValue(undefined);
  });

  it('sends immediate email when mode is immediate', async () => {
    const { db } = await import('../db/index.js');
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([{
        key: 'admin_notifications',
        value: {
          recipients: ['admin@test.com'],
          events: { student_joined: { enabled: true, mode: 'immediate' } },
        },
      }]) as ReturnType<typeof db.select>
    );

    await recordAdminEvent('student_joined', { displayName: 'Alice', email: 'alice@test.com' });
    expect(mockSendAndLog).toHaveBeenCalledWith(expect.objectContaining({
      emailType: 'admin_student_joined',
      to: 'admin@test.com',
    }));
  });

  it('inserts into queue when mode is digest', async () => {
    const { db } = await import('../db/index.js');
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([{
        key: 'admin_notifications',
        value: {
          recipients: ['admin@test.com'],
          events: { student_joined: { enabled: true, mode: 'digest' } },
        },
      }]) as ReturnType<typeof db.select>
    );

    await recordAdminEvent('student_joined', { displayName: 'Bob', email: null });
    expect(db.insert).toHaveBeenCalled();
    expect(insertedValues).toHaveLength(1);
    expect(insertedValues[0]).toMatchObject({
      eventType: 'student_joined',
      payload: { displayName: 'Bob', email: null },
    });
  });

  it('does nothing when event is disabled', async () => {
    const { db } = await import('../db/index.js');
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([{
        key: 'admin_notifications',
        value: {
          recipients: ['admin@test.com'],
          events: { student_joined: { enabled: false, mode: 'immediate' } },
        },
      }]) as ReturnType<typeof db.select>
    );

    await recordAdminEvent('student_joined', { displayName: 'Carol', email: null });
    expect(mockSendAndLog).not.toHaveBeenCalled();
    // Only the config select should have been called, not insert
    expect(insertedValues).toHaveLength(0);
  });

  it('does nothing when no recipients configured', async () => {
    const { db } = await import('../db/index.js');
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([{
        key: 'admin_notifications',
        value: {
          recipients: [],
          events: { student_joined: { enabled: true, mode: 'immediate' } },
        },
      }]) as ReturnType<typeof db.select>
    );

    await recordAdminEvent('student_joined', { displayName: 'Dave', email: null });
    expect(mockSendAndLog).not.toHaveBeenCalled();
  });

  it('does not throw on errors', async () => {
    const { db } = await import('../db/index.js');
    vi.mocked(db.select).mockImplementation(() => {
      throw new Error('DB down');
    });

    // Should not throw
    await recordAdminEvent('student_joined', { displayName: 'Error', email: null });
  });
});

describe('processDigest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updatedSets.length = 0;
    mockSendAndLog.mockResolvedValue(undefined);
  });

  it('returns 0 when queue is empty', async () => {
    const { db } = await import('../db/index.js');
    // First select: empty queue, second select: config
    let callCount = 0;
    vi.mocked(db.select).mockImplementation(() => {
      callCount++;
      return createQueryChain([]) as ReturnType<typeof db.select>;
    });

    const result = await processDigest();
    expect(result).toBe(0);
    expect(mockSendAndLog).not.toHaveBeenCalled();
  });

  it('sends digest email and marks entries processed', async () => {
    const { db } = await import('../db/index.js');
    const pendingEntries = [
      { id: 1, eventType: 'student_joined', payload: { displayName: 'Alice', email: 'a@t.com' }, createdAt: new Date(), processedAt: null },
      { id: 2, eventType: 'bug_report', payload: { title: 'Bug 1', reportedBy: 'Bob' }, createdAt: new Date(), processedAt: null },
    ];

    let selectCall = 0;
    vi.mocked(db.select).mockImplementation(() => {
      selectCall++;
      if (selectCall === 1) {
        // Queue entries
        return createQueryChain(pendingEntries) as ReturnType<typeof db.select>;
      }
      // Config
      return createQueryChain([{
        key: 'admin_notifications',
        value: {
          recipients: ['admin@test.com'],
          events: { student_joined: { enabled: true, mode: 'digest' }, bug_report: { enabled: true, mode: 'digest' } },
        },
      }]) as ReturnType<typeof db.select>;
    });

    vi.mocked(db.update).mockImplementation(() => ({
      set: vi.fn().mockImplementation((v: unknown) => {
        updatedSets.push(v);
        return createQueryChain([]);
      }),
    }) as unknown as ReturnType<typeof db.update>);

    const result = await processDigest();
    expect(result).toBe(2);
    expect(mockSendAndLog).toHaveBeenCalledWith(expect.objectContaining({
      emailType: 'admin_digest',
      to: 'admin@test.com',
    }));
    // Should mark both entries as processed
    expect(updatedSets).toHaveLength(2);
  });
});
