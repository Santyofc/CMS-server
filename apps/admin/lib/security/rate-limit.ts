import { createClient } from "redis";
import { logError } from "@/lib/security/logger";

const counters = new Map<string, { count: number; resetAt: number }>();
let redisClient: ReturnType<typeof createClient> | null = null;
let redisConnectPromise: Promise<ReturnType<typeof createClient>> | null = null;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
};

function inMemoryRateLimit(key: string, maxRequests: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = counters.get(key);

  if (!existing || existing.resetAt <= now) {
    counters.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0, retryAfterMs: existing.resetAt - now };
  }

  existing.count += 1;
  return { allowed: true, remaining: maxRequests - existing.count };
}

async function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  if (!redisConnectPromise) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error("REDIS_URL is required for production rate limiting.");
    }

    const client = createClient({ url: redisUrl });
    redisConnectPromise = client.connect().then(() => {
      redisClient = client;
      return client;
    });
  }

  return redisConnectPromise;
}

async function redisRateLimit(key: string, maxRequests: number, windowMs: number): Promise<RateLimitResult> {
  const client = await getRedisClient();
  const namespacedKey = `rl:${key}`;
  const count = await client.incr(namespacedKey);

  if (count === 1) {
    await client.pExpire(namespacedKey, windowMs);
  }

  const ttlMs = await client.pTTL(namespacedKey);
  if (count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, ttlMs)
    };
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - count),
    retryAfterMs: Math.max(0, ttlMs)
  };
}

export async function checkRateLimit(key: string, maxRequests: number, windowMs: number): Promise<RateLimitResult> {
  if (process.env.REDIS_URL) {
    try {
      return await redisRateLimit(key, maxRequests, windowMs);
    } catch (error) {
      if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
        return inMemoryRateLimit(key, maxRequests, windowMs);
      }

      logError({ component: "rate-limit", key }, error, "distributed rate limit unavailable");
      return { allowed: false, remaining: 0, retryAfterMs: windowMs };
    }
  }

  if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    return inMemoryRateLimit(key, maxRequests, windowMs);
  }

  logError({ component: "rate-limit", key }, new Error("REDIS_URL is missing"), "distributed rate limit misconfigured");
  return { allowed: false, remaining: 0, retryAfterMs: windowMs };
}
