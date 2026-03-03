import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type TokenPayload } from '../lib/jwt.js';
import { AppError } from './errorHandler.js';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'Authentication required');
  }

  try {
    req.user = verifyAccessToken(header.slice(7));
    next();
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    throw new AppError(403, 'Admin access required');
  }
  next();
}
