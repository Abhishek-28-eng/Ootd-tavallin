import { createApp } from './app';
import { connectDatabase } from './config/database';
import { connectRedis, closeRedis } from './config/redis';
import { logger } from './config/logger';
import { env } from './config/env';

async function main(): Promise<void> {
  // Connect to database first
  await connectDatabase();

  // Connect to Redis cache (falls back gracefully if offline)
  await connectRedis();

  // Wire all Sequelize model associations
  const { setupAssociations } = await import('./database/models');
  setupAssociations();

  const app = createApp();
  const server = app.listen(env.API_PORT, () => {
    logger.info(
      {
        port: env.API_PORT,
        baseUrl: env.API_BASE_URL,
        env: env.NODE_ENV,
      },
      `🚀 Tavallin API running`,
    );
  });

  // ─── Graceful Shutdown ───────────────────────────────────────
  const gracefulShutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutdown signal received');

    server.close(async () => {
      logger.info('HTTP server closed');
      try {
        const { closeDatabase } = await import('./config/database');
        await closeDatabase();
        await closeRedis();
        logger.info('Database and Redis connections closed');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Error during graceful shutdown');
        process.exit(1);
      }
    });

    // Force exit after 30s
    (setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000) as unknown as { unref: () => void }).unref();
  };

  process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
    process.exit(1);
  });

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception');
    process.exit(1);
  });
}

void main();
