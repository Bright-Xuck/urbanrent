import "dotenv/config";
import { createClient } from "redis";

const connectionString = process.env.REDIS_URL;

// One shared Redis client for the whole backend — the rate-limit store
// and the property cache both go through it. Redis is optional: the API
// falls back to in-memory rate limiting and direct database reads when a
// local or preview environment has no working endpoint.
//
// Upstash hands out rediss:// (TLS) URLs; node-redis negotiates TLS
// from the scheme itself, so no extra options are needed.
// Redis is an optimisation and a shared rate-limit store. The API must still
// start when a local/preview environment has no working Upstash endpoint.
const redis = createClient({
  ...(connectionString ? { url: connectionString } : {}),
  socket: {
    // A stale Upstash hostname should produce one clear warning, not an
    // endless DNS retry loop that floods the server logs.
    reconnectStrategy: false,
  },
});

export let redisAvailable = false;
let reportedError = false;

// An unhandled 'error' event crashes the process. Callers fail open
// (limit → allow, cache → DB), so a dropped connection logs and
// degrades instead of taking the server down.
redis.on("error", (error: Error) => {
  if (!reportedError) {
    console.warn("Redis unavailable; using database/in-memory fallbacks:", error.message);
    reportedError = true;
  }
  redisAvailable = false;
});

if (connectionString) {
  try {
    await redis.connect();
    redisAvailable = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("Redis unavailable; using database/in-memory fallbacks:", message);
  }
} else {
  console.warn("REDIS_URL is not configured; using database/in-memory fallbacks.");
}

export default redis;
