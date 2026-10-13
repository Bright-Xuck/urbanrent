import redis from "../config/redis.js";

// ============================================================
// PROPERTY CACHE
// ============================================================
// Short-TTL caching for the two public property reads (browse and
// guest detail) — the endpoints every visitor hits.
//
// INVALIDATION: a version counter. Every key embeds the current
// version; any property write bumps the counter with one INCR,
// instantly orphaning every cached response. The dead keys expire
// on their own TTL — no key-pattern deletion needed. One counter
// covers both cached routes.
//
// FAIL OPEN: every Redis call is wrapped, so a Redis outage serves
// from the DB instead of erroring. Slow beats broken.
// ============================================================

const TTL_SECONDS = 60;
const VERSION_KEY = "properties:cache:version";

export async function getOrSet<T>(
  key: string,
  loader: () => Promise<T>
): Promise<{ data: T; fromCache: boolean }> {
  let cacheKey: string | null = null;

  try {
    const version = (await redis.get(VERSION_KEY)) ?? "0";
    cacheKey = `properties:${version}:${key}`;
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      return { data: JSON.parse(cached) as T, fromCache: true };
    }
  } catch {
    // Redis unavailable — fall through to the DB (fail open).
  }

  // Loader errors (e.g. "Property not found") propagate untouched.
  const fresh = await loader();

  try {
    if (cacheKey) {
      await redis.set(cacheKey, JSON.stringify(fresh), { EX: TTL_SECONDS });
    }
  } catch {
    // A failed cache write never breaks the response.
  }

  return { data: fresh, fromCache: false };
}

// Called by every property mutation (create / update / delete /
// moderate): bumps the version, orphaning all cached responses.
export async function invalidatePropertiesCache() {
  try {
    await redis.incr(VERSION_KEY);
  } catch {
    // If the bump fails the cache just lives out its TTL.
  }
}
