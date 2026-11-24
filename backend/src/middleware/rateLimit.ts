import { Redis } from "@upstash/redis";
import rateLimit, { type Options, type Store } from "express-rate-limit";
import { env } from "../config/env";

const message = { success: false, error: { message: "Too many requests. Please try again shortly." } };

/**
 * express-rate-limit store backed by Upstash Redis (REST), so counters are shared by every serverless instance.
 * Fixed window: INCR the key, and set its expiry when the window starts.
 */
class UpstashStore implements Store {
  localKeys = false;
  prefix: string;
  private windowMs = 60_000;
  constructor(private redis: Redis, prefix: string) {
    this.prefix = `rl:${prefix}:`;
  }
  init(options: Options) {
    this.windowMs = options.windowMs;
  }
  async increment(key: string) {
    const k = this.prefix + key;
    const p = this.redis.pipeline();
    p.incr(k);
    p.pttl(k);
    const [hits, ttl] = (await p.exec()) as [number, number];
    let remaining = ttl;
    if (hits === 1 || ttl < 0) {
      // new window (or a key that somehow lost its expiry)
      await this.redis.pexpire(k, this.windowMs);
      remaining = this.windowMs;
    }
    return { totalHits: hits, resetTime: new Date(Date.now() + remaining) };
  }
  async decrement(key: string) {
    await this.redis.decr(this.prefix + key);
  }
  async resetKey(key: string) {
    await this.redis.del(this.prefix + key);
  }
}

const redis = env.upstashUrl && env.upstashToken ? new Redis({ url: env.upstashUrl, token: env.upstashToken }) : null;
export const rateLimitStore = redis ? "upstash" : "memory";

if (!redis && env.isProd) {
  console.warn(
    "[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set: limits are per-instance only and are weak on serverless. Set them in production.",
  );
}

function limiter(name: string, windowMs: number, limit: number) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message,
    ...(redis ? { store: new UpstashStore(redis, name), passOnStoreError: true } : {}),
  });
}

export const apiLimiter = limiter("api", 60 * 1000, 300);
export const authLimiter = limiter("auth", 15 * 60 * 1000, 10);
// Public write endpoints (orders, contact form)
export const publicWriteLimiter = limiter("write", 15 * 60 * 1000, 20);
