// ============================================================
// Redis Client — In-Memory Cache for Hot Feeds & Profiles
// Falls back gracefully if Redis is not available (dev mode)
// ============================================================

import Redis from 'ioredis';
import { logger } from './logger';

let redis: Redis | null = null;
let redisAvailable = false;

export function getRedis(): Redis | null {
  return redisAvailable ? redis : null;
}

export async function connectRedis(): Promise<void> {
  const redisUrl = process.env['REDIS_URL'] || 'redis://localhost:6379';

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // Don't retry — fail fast in dev
      connectTimeout: 2000,
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      if (redisAvailable) {
        logger.warn({ err }, 'Redis connection error — disabling cache');
        redisAvailable = false;
      }
    });

    redis.on('connect', () => {
      redisAvailable = true;
      logger.info('Redis connected — feed caching active');
    });

    await redis.connect();
  } catch (err) {
    logger.warn({ err }, 'Redis not available — running without cache (performance reduced)');
    redis = null;
    redisAvailable = false;
  }
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
    redisAvailable = false;
  }
}

// ─── Cache Helpers ────────────────────────────────────────────

const DEFAULT_TTL = 300; // 5 minutes

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis || !redisAvailable) return null;
  try {
    const val = await redis.get(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = DEFAULT_TTL): Promise<void> {
  if (!redis || !redisAvailable) return;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {
    // Silently fail — cache is best-effort
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!redis || !redisAvailable) return;
  try {
    await redis.del(key);
  } catch {
    // Silently fail
  }
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  if (!redis || !redisAvailable) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Silently fail
  }
}

// ─── Cache Key Builders ───────────────────────────────────────
export const CacheKeys = {
  feed: (userId: string, type: string, cursor?: string) =>
    `feed:${userId}:${type}:${cursor ?? 'first'}`,
  explore: (style?: string, occasion?: string, tag?: string, cursor?: string) =>
    `explore:${style ?? 'all'}:${occasion ?? 'all'}:${tag ?? 'all'}:${cursor ?? 'first'}`,
  trending: (cursor?: string) => `trending:${cursor ?? 'first'}`,
  spotlight: () => 'spotlight',
  profile: (username: string) => `profile:${username}`,
  userPosts: (userId: string, cursor?: string) => `userposts:${userId}:${cursor ?? 'first'}`,
};
