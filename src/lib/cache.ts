import { getRedisClient } from './redis';

interface CacheOptions {
  ttl?: number;
  prefix?: string;
}

const DEFAULT_TTL = 300;
const DEFAULT_PREFIX = 'paddlegrid';

function getCacheKey(key: string, prefix: string = DEFAULT_PREFIX): string {
  return `${prefix}:${key}`;
}

export async function getFromCache<T>(
  key: string,
  options: CacheOptions = {}
): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const cacheKey = getCacheKey(key, options.prefix);
    const cached = await redis.get(cacheKey);

    if (!cached) return null;

    return JSON.parse(cached) as T;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function setInCache<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    const cacheKey = getCacheKey(key, options.prefix);
    const ttl = options.ttl || DEFAULT_TTL;
    const serialized = JSON.stringify(value);

    await redis.setex(cacheKey, ttl, serialized);
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
}

export async function deleteFromCache(
  key: string,
  options: CacheOptions = {}
): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    const cacheKey = getCacheKey(key, options.prefix);
    await redis.del(cacheKey);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
}

export async function invalidatePattern(
  pattern: string,
  options: CacheOptions = {}
): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;

  try {
    const cachePattern = getCacheKey(pattern, options.prefix);
    const keys = await redis.keys(cachePattern);

    if (keys.length > 0) {
      await redis.del(...keys);
    }

    return true;
  } catch (error) {
    console.error('Cache invalidate pattern error:', error);
    return false;
  }
}

export async function cacheOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const cached = await getFromCache<T>(key, options);

  if (cached !== null) {
    return cached;
  }

  const fresh = await fetcher();
  await setInCache(key, fresh, options);

  return fresh;
}

export const CacheTTL = {
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  FIFTEEN_MINUTES: 900,
  THIRTY_MINUTES: 1800,
  ONE_HOUR: 3600,
  ONE_DAY: 86400,
  ONE_WEEK: 604800,
};

export const CacheKeys = {
  FACILITY: (id: string) => `facility:${id}`,
  FACILITY_COURTS: (facilityId: string) => `facility:${facilityId}:courts`,
  COURT: (id: string) => `court:${id}`,
  USER_PROFILE: (id: string) => `profile:${id}`,
  USER_BOOKINGS: (userId: string) => `user:${userId}:bookings`,
  COURT_AVAILABILITY: (courtId: string, date: string) =>
    `court:${courtId}:availability:${date}`,
  FACILITY_EVENTS: (facilityId: string) => `facility:${facilityId}:events`,
  FACILITY_STATS: (facilityId: string) => `facility:${facilityId}:stats`,
  LEADERBOARD: (facilityId?: string) =>
    facilityId ? `leaderboard:${facilityId}` : 'leaderboard:global',
};
