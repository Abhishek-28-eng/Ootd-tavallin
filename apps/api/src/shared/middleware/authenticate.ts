import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../errors/AppError';
import type { JwtPayload, UserRole } from '@tavallin/shared';
import { ErrorCodes } from '@tavallin/shared';

// Extend Express Request type
declare global {
  namespace Express {
    interface User extends JwtPayload {
      id: string;
    }
    interface Request {
      user?: User;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(AppError.unauthorized('No authentication token provided', ErrorCodes.UNAUTHORIZED));
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.user = { ...payload, id: payload.id ?? payload.sub };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(AppError.unauthorized('Access token has expired', ErrorCodes.TOKEN_EXPIRED));
    } else {
      next(AppError.unauthorized('Invalid access token', ErrorCodes.TOKEN_INVALID));
    }
  }
}

export const requireAuth = authenticate;

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
  } else {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
      req.user = { ...payload, id: payload.id ?? payload.sub };
    } catch {
      // Non-fatal for optional auth
    }
    next();
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AppError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(AppError.forbidden('Insufficient permissions', ErrorCodes.FORBIDDEN));
      return;
    }
    next();
  };
}

export const requireAdmin = requireRole('admin', 'super_admin');
export const requireModerator = requireRole('moderator', 'admin', 'super_admin');
export const requireSuperAdmin = requireRole('super_admin');
