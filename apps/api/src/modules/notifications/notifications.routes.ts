import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../shared/middleware/authenticate';
import { notificationsService } from './notifications.service';
import { respond } from '../../shared/helpers/response';
import { AppError } from '../../shared/errors/AppError';

export const notificationsRouter = Router();

// ─── Get user notifications ───────────────────────────────────
notificationsRouter.get(
  '/',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cursor = req.query['cursor'] as string | undefined;
      const limit = Number(req.query['limit']) || 20;

      const result = await notificationsService.getNotifications(req.user!.id, cursor, limit);
      respond(res, 200, result);
    } catch (err) {
      next(err);
    }
  },
);

// ─── Mark all notifications read ──────────────────────────────
notificationsRouter.patch(
  '/read-all',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await notificationsService.markAllAsRead(req.user!.id);
      respond(res, 200, null, 'All notifications marked as read');
    } catch (err) {
      next(err);
    }
  },
);

// ─── Mark single notification read ────────────────────────────
notificationsRouter.patch(
  '/:id/read',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await notificationsService.markAsRead(req.params['id']!, req.user!.id);
      respond(res, 200, null, 'Notification marked as read');
    } catch (err) {
      next(err);
    }
  },
);

// ─── Register device token for push notifications ─────────────
notificationsRouter.post(
  '/device-token',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, platform, expoToken } = req.body;
      if (!token || !platform) {
        throw AppError.badRequest('token and platform are required');
      }
      await notificationsService.registerDeviceToken(req.user!.id, {
        token,
        platform,
        expoToken,
      });
      respond(res, 200, null, 'Device token registered');
    } catch (err) {
      next(err);
    }
  },
);
