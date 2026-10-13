import type { Request, Response } from "express";
import { createHash } from "node:crypto";
import rateLimit, { HOUR, MINUTE, ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import redis from "../config/redis.js";

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
  /**
   * Key namespace in Redis, unique per limiter. Without distinct
   * prefixes, two limiters would share one counter.
   */
  prefix: string;
  /** Window length in ms (use the MINUTE / HOUR constants). */
  windowMs: number;
  /** Max requests per key per window. */
  limit: number;
  /**
   * What counts as one "user" for limiting. Omit to use the client
   * IP; supply one when IP alone is the wrong granularity.
   */
  keyGenerator?: (req: Request, res: Response) => string;
};

function createRateLimiter({
  prefix,
  windowMs,
  limit,
  keyGenerator,
}: LimiterOptions) {
  return rateLimit({
    windowMs,
    limit,
    // Redis-backed counts: shared across server instances and durable
    // across restarts (an in-memory counter resets on every deploy and
    // doubles when you run two instances). One store per limiter, keyed
    // by prefix, so their counters never collide.
    store: new RedisStore({
      prefix: `rl:${prefix}:`,
      sendCommand: (...args: string[]) => redis.sendCommand(args),
    }),
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

// --- Global: every /api route ---
// A scraping backstop: generous enough that a busy shared IP never
// feels it, tight enough to stop runaway clients. Mounted in app.ts
// on /api only, so uptime checks on /health never count.
export const apiLimiter = createRateLimiter({
  prefix: "api",
  windowMs: 15 * MINUTE,
  limit: 300,
});

// --- Login: the strictest ---
// Every request is a credential guess and a hit is catastrophic —
// unlike a page view, a successful brute force can't be undone.
// Keyed on IP + email: brute-forcing one account burns that
// account's budget, while two different people behind one campus
// NAT keep separate budgets (an IP-only key would merge them).
export const loginLimiter = createRateLimiter({
  prefix: "login",
  windowMs: 15 * MINUTE,
  limit: 10,
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip ?? "unknown")}:${req.body?.email ?? ""}`, 
});

// --- Register: signup abuse ---
// Bulk account creation from one source is the abuse shape here,
// and no legitimate user creates accounts fast. IP-keyed is fine:
// registrations are rare, so even a NAT rarely feels it.
export const registerLimiter = createRateLimiter({
  prefix: "register",
  windowMs: HOUR,
  limit: 20,
});

// --- Refresh: called on every page load ---
// The client refreshes its access token whenever it's missing, so
// traffic scales with user count, not abuse. Per-IP would break
// instantly behind a shared NAT (100 students = 100 refreshes/min
// from one IP), so the budget is per-session via the refresh
// cookie: each browser gets its own counter and NATs share nothing.
export const refreshLimiter = createRateLimiter({
  prefix: "refresh",
  windowMs: 15 * MINUTE,
  limit: 60,
  keyGenerator: (req) => {
    const cookie: string | undefined = req.cookies?.RefreshToken;
    if (!cookie) return ipKeyGenerator(req.ip ?? "unknown");
    // Hash the cookie: it's a secret and must not sit in a store key.
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
