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

// Create a fully chainable mock that supports any Drizzle chain
function createQueryChain(result: unknown) {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) => resolve(result);
      }
      // Any method call returns the same proxy (chainable)
      return vi.fn().mockReturnValue(new Proxy({}, handler));
    },
  };
  return new Proxy({}, handler);
}

vi.mock('../db/index.js', () => ({
  db: {
    select: vi.fn().mockImplementation(() => createQueryChain(mockPalettes)),
  },
}));

// Need to import after mocking
const { palettesRouter } = await import('./palettes.js');
const express = (await import('express')).default;
const request = (await import('supertest')).default;

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/palettes', palettesRouter);
  return app;
}

describe('GET /api/palettes', () => {
  it('returns a list of palettes with 200 status', async () => {
    const app = createApp();
    const res = await request(app).get('/api/palettes');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0]).toHaveProperty('name', 'Test Default');
    expect(res.body[1]).toHaveProperty('slug', 'test-ocean');
  });
});

describe('GET /api/palettes/:slug', () => {
  it('returns a single palette when found', async () => {
    // For the single-palette endpoint, mock returns array with 1 element (destructured as [row])
    const { db } = await import('../db/index.js');
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([mockPalettes[0]]) as ReturnType<typeof db.select>
    );

    const app = createApp();
    const res = await request(app).get('/api/palettes/test-default');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('slug', 'test-default');
  });

  it('returns 404 for unknown slug', async () => {
    const { db } = await import('../db/index.js');
    vi.mocked(db.select).mockImplementation(() =>
      createQueryChain([]) as ReturnType<typeof db.select>
    );

    const app = createApp();
    const res = await request(app).get('/api/palettes/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Palette not found');
  });
});
