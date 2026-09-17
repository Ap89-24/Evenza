import { redis } from "./redis";

const LIMITS = {
  FREE: 20,
  PRO: 200,
};

const WINDOW_SECONDS = 3600; // 1 hour sliding/fixed window

/**
 * Perform Redis-based rate limiting for AI operations.
 * Uses rate:ai:{userId} as the Redis key.
 *
 * @param {string} userId - Authenticated Clerk userId
 * @param {boolean} isPro - Whether user is on Pro plan according to Convex/billing
 * @returns {Promise<{ allowed: boolean, current: number, limit: number, resetInSeconds: number }>}
 */
export async function checkRateLimit(userId, isPro = false) {
  const limit = isPro ? LIMITS.PRO : LIMITS.FREE;

  if (!userId) {
    return { allowed: false, current: 0, limit, resetInSeconds: WINDOW_SECONDS };
  }

  if (!redis) {
    console.warn("⚠️ Redis unavailable - bypassing rate limit check (fallback mode)");
    return { allowed: true, current: 0, limit, resetInSeconds: WINDOW_SECONDS };
  }

  const key = `rate:ai:${userId}`;

  try {
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }

    const ttl = await redis.ttl(key);
    const resetInSeconds = ttl > 0 ? ttl : WINDOW_SECONDS;

    if (current > limit) {
      console.warn(`🚨 Redis rate limit exceeded for user ${userId} [${current}/${limit}]`);
      return {
        allowed: false,
        current,
        limit,
        resetInSeconds,
      };
    }

    return {
      allowed: true,
      current,
      limit,
      resetInSeconds,
    };
  } catch (error) {
    console.error(`Redis rate limit error for user ${userId}:`, error.message);
    // Fallback open if Redis fails so user app isn't broken
    return {
      allowed: true,
      current: 0,
      limit,
      resetInSeconds: WINDOW_SECONDS,
    };
  }
}
