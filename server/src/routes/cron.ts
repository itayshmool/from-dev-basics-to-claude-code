import { Router } from 'express';
import { env } from '../lib/env.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { processDigest } from '../lib/adminNotifications.js';

export const cronRouter = Router();

// Simple shared-secret auth for cron endpoints
function requireCronSecret(req: import('express').Request) {
  const secret = req.headers['x-cron-secret'] as string | undefined;
  if (!env.CRON_SECRET) {
    throw new AppError(503, 'Cron secret not configured');
  }
  if (secret !== env.CRON_SECRET) {
    throw new AppError(401, 'Invalid cron secret');
  }
}

// POST /api/cron/digest — process pending digest notifications
cronRouter.post('/digest', asyncHandler(async (req, res) => {
  requireCronSecret(req);
  const processed = await processDigest();
  res.json({ processed });
}));
