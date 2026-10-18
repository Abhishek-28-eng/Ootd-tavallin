import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  APP_NAME: z.string().default('Tavallin'),
  APP_VERSION: z.string().default('1.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // Server
  API_PORT: z.coerce.number().default(3000),
  API_BASE_URL: z.string().url().default('http://localhost:3000'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173,http://localhost:19006'),

  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(3306),
  DB_NAME: z.string().default('tavallin_dev'),
  DB_USER: z.string().default('tavallin'),
  DB_PASSWORD: z.string().default('tavallin_secret'),
  DB_POOL_MIN: z.coerce.number().default(2),
  DB_POOL_MAX: z.coerce.number().default(10),
  DB_LOGGING: z.coerce.boolean().default(false),

  // Test DB
  TEST_DB_NAME: z.string().default('tavallin_test'),
  TEST_DB_HOST: z.string().default('localhost'),
  TEST_DB_PORT: z.coerce.number().default(3306),
  TEST_DB_USER: z.string().default('tavallin'),
  TEST_DB_PASSWORD: z.string().default('tavallin_secret'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Email
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  EMAIL_FROM: z.string().default('Tavallin <noreply@tavallin.com>'),

  // Storage
  STORAGE_PROVIDER: z.enum(['s3', 'local']).default('local'),
  STORAGE_BUCKET: z.string().default('tavallin-media'),
  STORAGE_REGION: z.string().default('ap-south-1'),
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_ACCESS_KEY_ID: z.string().default(''),
  STORAGE_SECRET_ACCESS_KEY: z.string().default(''),
  STORAGE_PUBLIC_BASE_URL: z.string().default('http://localhost:3000/uploads'),
  STORAGE_UPLOAD_SIZE_LIMIT_MB: z.coerce.number().default(10),
  STORAGE_PRESIGNED_EXPIRY_SECONDS: z.coerce.number().default(300),

  // Firebase
  FIREBASE_PROJECT_ID: z.string().default(''),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().default(''),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().default(''),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(10),

  // Password Reset
  PASSWORD_RESET_TOKEN_EXPIRES_MIN: z.coerce.number().default(60),
  EMAIL_VERIFY_TOKEN_EXPIRES_HOURS: z.coerce.number().default(24),

  // Admin bootstrap
  ADMIN_BOOTSTRAP_EMAIL: z.string().email().default('admin@tavallin.com'),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(8).default('ChangeMe123!'),

  // Feature Flags
  FEATURE_PUSH_NOTIFICATIONS: z.coerce.boolean().default(false),
  FEATURE_EMAIL_VERIFICATION: z.coerce.boolean().default(true),
  FEATURE_WEATHER_RECOMMENDATIONS: z.coerce.boolean().default(false),
  FEATURE_AI_STYLIST: z.coerce.boolean().default(false),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
