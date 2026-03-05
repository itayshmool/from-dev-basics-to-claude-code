import { Router } from 'express';
import { asc, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { palettes } from '../db/schema.js';

export const palettesRouter = Router();

// GET /api/palettes — list active palettes (public, no auth)
palettesRouter.get('/', async (_req, res) => {
  const rows = await db.select({
    id: palettes.id,
    name: palettes.name,
    slug: palettes.slug,
    colors: palettes.colors,
    isDefault: palettes.isDefault,
    order: palettes.order,
  })
    .from(palettes)
    .where(eq(palettes.isActive, true))
    .orderBy(asc(palettes.order));

  res.json(rows);
});

// GET /api/palettes/:slug — get single palette (public)
palettesRouter.get('/:slug', async (req, res) => {
  const [row] = await db.select({
    id: palettes.id,
    name: palettes.name,
    slug: palettes.slug,
    colors: palettes.colors,
    isDefault: palettes.isDefault,
    order: palettes.order,
  })
    .from(palettes)
    .where(eq(palettes.slug, req.params.slug))
    .limit(1);

  if (!row) {
    res.status(404).json({ error: 'Palette not found' });
    return;
  }
  res.json(row);
});
