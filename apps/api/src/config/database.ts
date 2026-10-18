import { Sequelize } from 'sequelize';
import { env } from './env';
import { logger } from './logger';

const isTest = env.NODE_ENV === 'test';

export const sequelize = new Sequelize({
  dialect: 'mysql',
  host: isTest ? env.TEST_DB_HOST : env.DB_HOST,
  port: isTest ? env.TEST_DB_PORT : env.DB_PORT,
  database: isTest ? env.TEST_DB_NAME : env.DB_NAME,
  username: isTest ? env.TEST_DB_USER : env.DB_USER,
  password: isTest ? env.TEST_DB_PASSWORD : env.DB_PASSWORD,
  pool: {
    min: env.DB_POOL_MIN,
    max: env.DB_POOL_MAX,
    acquire: 30000,
    idle: 10000,
  },
  logging: env.DB_LOGGING
    ? (sql: string) => logger.debug({ sql }, 'Query executed')
    : false,
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: true,
    underscored: true,
  },
  dialectOptions: {
    charset: 'utf8mb4',
    decimalNumbers: true,
  },
  timezone: '+00:00', // UTC
});

export async function connectDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info(
      {
        host: isTest ? env.TEST_DB_HOST : env.DB_HOST,
        database: isTest ? env.TEST_DB_NAME : env.DB_NAME,
      },
      'Database connection established',
    );
  } catch (error) {
    logger.error({ error }, 'Failed to connect to database');
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  await sequelize.close();
  logger.info('Database connection closed');
}
