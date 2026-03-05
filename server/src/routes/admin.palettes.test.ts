import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPalettes = [
  {
    id: 'aaa-111',
    name: 'Test Default',
    slug: 'test-default',
    colors: { dark: { '--color-bg-primary': '#111' }, light: {} },
    isDefault: true,
    isActive: true,
    order: 0,
  },
  {
    id: 'bbb-222',
    name: 'Test Ocean',
    slug: 'test-ocean',
    colors: { dark: { '--color-bg-primary': '#0A1628' }, light: {} },
    isDefault: false,
    isActive: true,
    order: 1,
  },
];

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

vi.mock('../db/index.js', () => ({
  db: {
    select: vi.fn().mockImplementation(() => createQueryChain(mockPalettes)),
    insert: vi.fn().mockImplementation(() => createQueryChain([])),
    update: vi.fn().mockImplementation(() => createQueryChain([])),
    delete: vi.fn().mockImplementation(() => createQueryChain([])),
  },
}));

vi.mock('../lib/password.js', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed'),
  verifyPassword: vi.fn().mockResolvedValue(true),
}));

vi.mock('../lib/jwt.js', () => ({
  signAccessToken: vi.fn().mockReturnValue('mock-access-token'),
  signRefreshToken: vi.fn().mockReturnValue('mock-refresh-token'),
  verifyAccessToken: vi.fn().mockReturnValue({ userId: 'admin-123', role: 'admin' }),
  verifyRefreshToken: vi.fn().mockReturnValue({ userId: 'admin-123', role: 'admin' }),
}));

const { adminRouter } = await import('./admin.js');
const express = (await import('express')).default;
const request = (await import('supertest')).default;
const { errorHandler } = await import('../middleware/errorHandler.js');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRouter);
  app.use(errorHandler);
  return app;
}

describe('GET /api/admin/palettes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all palettes with 200 status', async () => {
    const { db } = await import('../db/index.js');
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain(mockPalettes) as ReturnType<typeof db.select>
    );

    const app = createApp();
    const res = await request(app)
      .get('/api/admin/palettes')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
  });
});

describe('POST /api/admin/palettes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a palette and returns 201', async () => {
    const { db } = await import('../db/index.js');
    // Mock slug uniqueness check returns empty (no conflict)
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([]) as ReturnType<typeof db.select>
    );
    const newPalette = {
      id: 'ccc-333',
      name: 'New Palette',
      slug: 'new-palette',
      colors: { dark: { '--color-bg-primary': '#222' }, light: {} },
      isDefault: false,
      isActive: true,
      order: 2,
    };
    vi.mocked(db.insert).mockImplementation(() =>
      createQueryChain([newPalette]) as ReturnType<typeof db.insert>
    );

    const app = createApp();
    const res = await request(app)
      .post('/api/admin/palettes')
      .set('Authorization', 'Bearer mock-token')
      .send({
        name: 'New Palette',
        slug: 'new-palette',
        colors: { dark: { '--color-bg-primary': '#222' }, light: {} },
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('name', 'New Palette');
  });

  it('rejects invalid palette data with 400', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/admin/palettes')
      .set('Authorization', 'Bearer mock-token')
      .send({ name: '' }); // Missing required fields

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/admin/palettes/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates a palette and returns updated data', async () => {
    const { db } = await import('../db/index.js');
    const updated = { ...mockPalettes[1], name: 'Updated Ocean' };
    vi.mocked(db.update).mockImplementation(() =>
      createQueryChain([updated]) as ReturnType<typeof db.update>
    );

    const app = createApp();
    const res = await request(app)
      .put('/api/admin/palettes/bbb-222')
      .set('Authorization', 'Bearer mock-token')
      .send({ name: 'Updated Ocean' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'Updated Ocean');
  });
});

describe('DELETE /api/admin/palettes/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes a non-default palette', async () => {
    const { db } = await import('../db/index.js');
    // select returns the non-default palette
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([{ id: 'bbb-222', isDefault: false }]) as ReturnType<typeof db.select>
    );
    vi.mocked(db.update).mockImplementation(() =>
      createQueryChain([]) as ReturnType<typeof db.update>
    );
    vi.mocked(db.delete).mockImplementation(() =>
      createQueryChain([]) as ReturnType<typeof db.delete>
    );

    const app = createApp();
    const res = await request(app)
      .delete('/api/admin/palettes/bbb-222')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('blocks deletion of default palette', async () => {
    const { db } = await import('../db/index.js');
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([{ id: 'aaa-111', isDefault: true }]) as ReturnType<typeof db.select>
    );

    const app = createApp();
    const res = await request(app)
      .delete('/api/admin/palettes/aaa-111')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Cannot delete the default palette');
  });
});

describe('PUT /api/admin/palettes/:id/default', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets a palette as default', async () => {
    const { db } = await import('../db/index.js');
    // select returns the palette
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([{ id: 'bbb-222' }]) as ReturnType<typeof db.select>
    );
    const updatedPalette = { ...mockPalettes[1], isDefault: true };
    vi.mocked(db.update).mockImplementation(() =>
      createQueryChain([updatedPalette]) as ReturnType<typeof db.update>
    );

    const app = createApp();
    const res = await request(app)
      .put('/api/admin/palettes/bbb-222/default')
      .set('Authorization', 'Bearer mock-token');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('isDefault', true);
  });
});
