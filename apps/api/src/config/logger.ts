import pino from 'pino';
import { env } from './env';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: {
    app: env.APP_NAME,
    version: env.APP_VERSION,
    env: env.NODE_ENV,
  },
  ...(env.NODE_ENV !== 'production'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
      }
    : {
        // Production: structured JSON, no pretty printing
        redact: {
          paths: ['req.headers.authorization', 'req.body.password', 'req.body.currentPassword', 'req.body.newPassword'],
          censor: '[REDACTED]',
        },
      }),
});
