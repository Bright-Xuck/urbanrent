import type { Request, Response } from "express";
import { createHash } from "node:crypto";
import rateLimit, { HOUR, MINUTE, ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis, { redisAvailable } from "../config/redis.js";

// ============================================================
// RATE LIMITERS
// ============================================================
// One factory so every limiter shares the same headers, 429 shape,
// and store. The numbers sit next to the reasoning — the "why"
// matters more than the "how much".
//
// Counting happens per key (see keyGenerator) inside a time window.
// Hitting the cap returns a JSON { message } 429 — this API speaks
// JSON everywhere, so the library's plain-text default is overridden.
// ============================================================

type LimiterOptions = {
  
  prefix: string;
  windowMs: number;
  limit: number;
  keyGenerator?: (req: Request, res: Response) => string;
};

function createRateLimiter({
  prefix,
  windowMs,
  limit,
  keyGenerator,
}: LimiterOptions) {
  const store = redisAvailable
    ? new RedisStore({
        prefix: `rl:${prefix}:`,
        sendCommand: (...args: string[]) => redis.sendCommand(args),
      })
    : undefined;

  return rateLimit({
    windowMs,
    limit,
    // Redis-backed counts: shared across server instances and durable
    // across restarts (an in-memory counter resets on every deploy and
    // doubles when you run two instances). One store per limiter, keyed
    // by prefix, so their counters never collide.
    ...(store ? { store } : {}),
    // A Redis outage must never turn a normal API request into a 500.
    passOnStoreError: true,
    standardHeaders: true, // RateLimit-Limit / -Remaining / -Reset
    legacyHeaders: false, // no old X-RateLimit-* headers
    ...(keyGenerator ? { keyGenerator } : {}),
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        message: "Too many requests — please slow down and try again later.",
      });
    },
  });
}


export const apiLimiter = createRateLimiter({
  prefix: "api",
  windowMs: 15 * MINUTE,
  limit: 300,
});


export const loginLimiter = createRateLimiter({
  prefix: "login",
  windowMs: 15 * MINUTE,
  limit: 10,
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip ?? "unknown")}:${req.body?.email ?? ""}`, 
});


export const registerLimiter = createRateLimiter({
  prefix: "register",
  windowMs: HOUR,
  limit: 20,
});


export const refreshLimiter = createRateLimiter({
  prefix: "refresh",
  windowMs: 15 * MINUTE,
  limit: 60,
  keyGenerator: (req) => {
    const cookie: string | undefined = req.cookies?.RefreshToken;
    if (!cookie) return ipKeyGenerator(req.ip ?? "unknown");
    return `session:${createHash("sha256").update(cookie).digest("hex").slice(0, 16)}`;
  },
});

// --- Uploads: property images + verification documents ---
// Keyed on the authenticated user (the routes run authenticate
// first), so one abuser can't burn the budget of everyone sharing
// their IP. 30/hour is ~6 image batches or 30 ID documents.
export const uploadLimiter = createRateLimiter({
  prefix: "upload",
  windowMs: HOUR,
  limit: 30,
  keyGenerator: (req) => req.user?.userId ?? ipKeyGenerator(req.ip ?? "unknown"),
});
