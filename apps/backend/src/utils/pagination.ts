import type { Request } from "express";

// ============================================================
// PAGINATION
// ============================================================
// One place for the page-size rules, shared by every paginated
// endpoint (browse, my-listings, admin users, reports, verification
// queue) so the cap can't drift between them.
//
// The cap exists because ?limit=999999 fetches the whole table in
// one response — measured on this app: 20k rows = ~9.5MB and 30s to
// transfer. A single scraper request could do that.
// ============================================================

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

type Pagination = { offset: number; limit: number };

// Returns null when the query params are invalid (negative values),
// so callers can answer 400 exactly as before.
export function readPagination(req: Request): Pagination | null {
  const offset = Number(req.query.offset) || 0;
  const requested = Number(req.query.limit) || DEFAULT_PAGE_SIZE;

  if (offset < 0 || requested < 1) return null;

  return { offset, limit: Math.min(requested, MAX_PAGE_SIZE) };
}
