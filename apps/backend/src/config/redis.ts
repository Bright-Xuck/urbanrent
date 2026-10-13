import "dotenv/config";
import { createClient } from "redis";

const connectionString = process.env.REDIS_URL;

if (!connectionString) {
  throw new Error("REDIS_URL environment variable is not set");
}

// One shared Redis client for the whole backend — the rate-limit store
// and the property cache both go through it. Same fail-fast pattern as
// prisma.ts and supabase.ts: a missing connection string is a startup
// error, not a runtime surprise.
//
// Upstash hands out rediss:// (TLS) URLs; node-redis negotiates TLS
// from the scheme itself, so no extra options are needed.
const redis = createClient({ url: connectionString });

// An unhandled 'error' event crashes the process. Callers fail open
// (limit → allow, cache → DB), so a dropped connection logs and
// degrades instead of taking the server down.
redis.on("error", (error: Error) => {
  console.error("Redis error:", error.message);
});

// Connect HERE, at module load (top-level await), not in server.ts:
// the rate limiters are created when their modules are imported, and
// their stores initialize immediately — importing this module must
// therefore finish with a connected client. A failed connect rejects
// this module and crashes startup: fail fast, never half-usable.
await redis.connect();

export default redis;
