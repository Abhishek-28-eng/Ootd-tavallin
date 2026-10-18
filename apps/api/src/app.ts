import express, { type Request, type Response, type NextFunction } from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import pinoHttp from 'pino-http';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { logger } from './config/logger';

// Route imports
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { outfitsRouter } from './modules/outfits/outfits.routes';
import { commentsRouter } from './modules/comments/comments.routes';
import { collectionsRouter } from './modules/collections/collections.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';
import { mediaRouter } from './modules/media/media.routes';
import { reportsRouter } from './modules/reports/reports.routes';
import { searchRouter } from './modules/search/search.routes';
import { stylistRouter } from './modules/stylist/stylist.routes';
import { adminRouter } from './modules/admin/admin.routes';

import { AppError } from './shared/errors/AppError';
import { ErrorCodes } from '@tavallin/shared';

export function createApp(): express.Application {
  const app = express();

  // ─── Security ────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    }),
  );

  // ─── Request Limits ───────────────────────────────────────────
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));
  app.use(compression());
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // ─── HTTP Logging ─────────────────────────────────────────────
  if (env.NODE_ENV !== 'test') {
    app.use(
      pinoHttp({
        logger,
        redact: ['req.headers.authorization'],
        customLogLevel: (_req, res) => {
          if (res.statusCode >= 500) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
      }),
    );
  }

  // ─── Global Rate Limit ────────────────────────────────────────
  const globalLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: ErrorCodes.RATE_LIMITED,
        message: 'Too many requests. Please try again later.',
      },
    },
  });
  app.use('/api/', globalLimiter);

  // ─── Health & Ready Endpoints ─────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      app: env.APP_NAME,
      version: env.APP_VERSION,
      timestamp: new Date().toISOString(),
      env: env.NODE_ENV,
    });
  });

  app.get('/ready', async (_req, res) => {
    try {
      const { sequelize } = await import('./config/database');
      await sequelize.authenticate();
      res.json({ status: 'ready', database: 'connected' });
    } catch {
      res.status(503).json({ status: 'not_ready', database: 'disconnected' });
    }
  });

  // ─── API Routes ───────────────────────────────────────────────
  const apiRouter = express.Router();

  apiRouter.use('/auth', authRouter);
  apiRouter.use('/users', usersRouter);
  apiRouter.use('/outfits', outfitsRouter);
  apiRouter.use('/comments', commentsRouter);
  apiRouter.use('/collections', collectionsRouter);
  apiRouter.use('/notifications', notificationsRouter);
  apiRouter.use('/media', mediaRouter);
  apiRouter.use('/reports', reportsRouter);
  apiRouter.use('/search', searchRouter);
  apiRouter.use('/stylist', stylistRouter);
  apiRouter.use('/admin', adminRouter);

  app.use('/api/v1', apiRouter);

  // ─── 404 Handler ─────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: ErrorCodes.NOT_FOUND,
        message: 'The requested resource was not found.',
      },
    });
  });

  // ─── Global Error Handler ────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
          ...(err.details ? { details: err.details } : {}),
        },
      });
      return;
    }

    // CORS errors
    if (err.message.includes('not allowed by CORS')) {
      res.status(403).json({
        success: false,
        error: {
          code: ErrorCodes.FORBIDDEN,
          message: 'CORS policy violation.',
        },
      });
      return;
    }

    logger.error({ err }, 'Unhandled error');

    res.status(500).json({
      success: false,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message:
          env.NODE_ENV === 'production'
            ? 'An unexpected error occurred. Please try again later.'
            : (err.message ?? 'Internal server error'),
      },
    });
  });

  return app;
}
