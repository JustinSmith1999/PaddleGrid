import { supabase } from './supabase';
import { getRedisClient } from './redis';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const defaultConfig: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60000,
};

async function checkRateLimitRedis(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: Date } | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const key = `ratelimit:${endpoint}:${identifier}`;
    const windowSeconds = Math.ceil(config.windowMs / 1000);

    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }

    const ttl = await redis.ttl(key);
    const resetAt = new Date(Date.now() + ttl * 1000);

    if (count > config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
      };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - count,
      resetAt,
    };
  } catch (error) {
    console.error('Redis rate limit check failed:', error);
    return null;
  }
}

async function checkRateLimitDatabase(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  try {
    const windowStart = new Date(Date.now() - config.windowMs);

    const { data: existing, error: fetchError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!existing) {
      const { error: insertError } = await supabase
        .from('rate_limits')
        .insert({
          identifier,
          endpoint,
          request_count: 1,
          window_start: new Date(),
        });

      if (insertError) throw insertError;

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: new Date(Date.now() + config.windowMs),
      };
    }

    if (existing.request_count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(new Date(existing.window_start).getTime() + config.windowMs),
      };
    }

    const { error: updateError } = await supabase
      .from('rate_limits')
      .update({
        request_count: existing.request_count + 1,
        updated_at: new Date(),
      })
      .eq('id', existing.id);

    if (updateError) throw updateError;

    return {
      allowed: true,
      remaining: config.maxRequests - existing.request_count - 1,
      resetAt: new Date(new Date(existing.window_start).getTime() + config.windowMs),
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowMs),
    };
  }
}

export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  config: RateLimitConfig = defaultConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const redisResult = await checkRateLimitRedis(identifier, endpoint, config);

  if (redisResult !== null) {
    return redisResult;
  }

  return checkRateLimitDatabase(identifier, endpoint, config);
}

export const RATE_LIMIT_CONFIGS = {
  fileUpload: { maxRequests: 10, windowMs: 60000 },
  postCreation: { maxRequests: 20, windowMs: 60000 },
  courtReserveSync: { maxRequests: 5, windowMs: 60000 },
  bookingCreation: { maxRequests: 30, windowMs: 60000 },
  default: { maxRequests: 100, windowMs: 60000 },
};
