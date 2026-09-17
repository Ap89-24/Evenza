import { redis } from "./redis";
import crypto from "crypto";

/**
 * Generate SHA-256 hash from string/object input using Node's crypto module
 */
export function generateHash(input) {
  const str = typeof input === "string" ? input : JSON.stringify(input);
  return crypto.createHash("sha256").update(str).digest("hex");
}

/**
 * Safely get cached value from Redis
 */
export async function getCached(key) {
  if (!redis) {
    console.log("Redis unavailable - skipping cache lookup");
    return null;
  }

  try {
    const data = await redis.get(key);
    if (data !== null && data !== undefined) {
      console.log(`Redis cache HIT [${key}]`);
      return data;
    }
    console.log(`Redis cache MISS [${key}]`);
    return null;
  } catch (error) {
    console.error(`Redis unavailable or error during get [${key}]:`, error.message);
    return null;
  }
}

/**
 * Safely set cached value in Redis with TTL (in seconds)
 */
export async function setCached(key, value, ttlSeconds = 600) {
  if (!redis) {
    console.log("Redis unavailable - skipping cache store");
    return false;
  }

  try {
    if (ttlSeconds && ttlSeconds > 0) {
      await redis.set(key, value, { ex: ttlSeconds });
    } else {
      await redis.set(key, value);
    }
    console.log(`Redis cache STORED [${key}] (TTL: ${ttlSeconds}s)`);
    return true;
  } catch (error) {
    console.error(`Redis unavailable or error during set [${key}]:`, error.message);
    return false;
  }
}

/**
 * Safely delete cached value or pattern from Redis
 */
export async function deleteCached(key) {
  if (!redis) {
    return false;
  }

  try {
    if (key.includes("*")) {
      const keys = await redis.keys(key);
      if (keys && keys.length > 0) {
        await redis.del(...keys);
        console.log(`Redis cache INVALIDATED pattern [${key}] (${keys.length} keys)`);
      }
    } else {
      await redis.del(key);
      console.log(`Redis cache INVALIDATED [${key}]`);
    }
    return true;
  } catch (error) {
    console.error(`Redis unavailable or error during delete [${key}]:`, error.message);
    return false;
  }
}
