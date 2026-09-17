/**
 * Upstash Redis Client Layer
 * Connects directly to Upstash Redis REST API using standard fetch.
 * Provides identical API to @upstash/redis (get, set, incr, expire, ttl, del, keys).
 */

class UpstashRedisClient {
  constructor(url, token) {
    this.url = url.replace(/\/$/, "");
    this.token = token;
  }

  async command(args) {
    try {
      const res = await fetch(this.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(args),
        cache: "no-store",
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Upstash Redis HTTP status ${res.status}: ${errText}`);
      }

      const data = await res.json();
      if (data.error) {
        throw new Error(`Upstash Redis error: ${data.error}`);
      }
      return data.result;
    } catch (error) {
      console.error("❌ Upstash Redis command error:", error.message);
      throw error;
    }
  }

  async get(key) {
    const res = await this.command(["GET", key]);
    if (res === null || res === undefined) return null;
    if (typeof res === "string") {
      try {
        return JSON.parse(res);
      } catch {
        return res;
      }
    }
    return res;
  }

  async set(key, value, options = {}) {
    const valStr = typeof value === "string" ? value : JSON.stringify(value);
    const cmd = ["SET", key, valStr];
    if (options?.ex) {
      cmd.push("EX", String(options.ex));
    }
    return await this.command(cmd);
  }

  async incr(key) {
    const res = await this.command(["INCR", key]);
    return Number(res);
  }

  async expire(key, seconds) {
    return await this.command(["EXPIRE", key, String(seconds)]);
  }

  async ttl(key) {
    const res = await this.command(["TTL", key]);
    return Number(res);
  }

  async del(...keys) {
    if (!keys || keys.length === 0) return 0;
    return await this.command(["DEL", ...keys]);
  }

  async keys(pattern) {
    const res = await this.command(["KEYS", pattern]);
    return Array.isArray(res) ? res : [];
  }
}

let redisInstance = null;

try {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    redisInstance = new UpstashRedisClient(url.trim(), token.trim());
    console.log("⚡ Upstash Redis client initialized successfully.");
  } else {
    console.warn("⚠️ UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing. Redis operating in fallback mode.");
  }
} catch (error) {
  console.error("❌ Failed to initialize Redis client:", error);
  redisInstance = null;
}

export const redis = redisInstance;
