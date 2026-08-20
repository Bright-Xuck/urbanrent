import prisma from "../config/prisma.js";

// ============================================================
// SESSION REPOSITORY
// ============================================================
// This file handles ALL database operations related to the Session table.
// The Session table stores refresh tokens (hashed) so we can:
//   1. Track which devices/users have active sessions
//   2. Revoke a session on logout (so the refresh token becomes useless)
//   3. Validate a refresh token when it's used to get a new access token
//
// The Session model in our schema has these fields:
//   id         - unique session identifier (uuid)
//   userId     - which user this session belongs to
//   tokenHash  - the HASHED refresh token (never the raw token!)
//   issuedAt   - when the session was created
//   expiresAt  - when the session/refresh token expires
//   revokedAt  - when the session was revoked (null = still active)
//   device     - optional device info (e.g. "iPhone", "Chrome on Windows")
//   userAgent  - optional browser/device user agent string
// ============================================================

// ============================================================
// CREATE SESSION
// ============================================================
// Called when a user logs in. We create a new session record
// that stores the hashed refresh token.
//
// Parameters:
//   userId     - the user who is logging in
//   tokenHash  - the SHA-256 hash of the refresh token
//   expiresAt  - when this session/refresh token expires
//   device     - optional device description
//   userAgent  - optional user agent string
// ============================================================
export async function createSession(data: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  device?: string;
  userAgent?: string;
}) {
  // prisma.session.create() inserts a new row into the sessions table.
  // The `data` object maps directly to the columns in the table.
  return prisma.session.create({
    data: {
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
      // Only include device/userAgent if they were provided.
      // The `?? null` makes TypeScript happy with exactOptionalPropertyTypes
      // since the schema allows these fields to be null.
      device: data.device ?? null,
      userAgent: data.userAgent ?? null,
    },
  });
}

// ============================================================
// FIND SESSION BY TOKEN HASH
// ============================================================
// Called when a refresh token is used to get a new access token.
// We hash the incoming refresh token, then look up the session
// by that hash to see if it exists and is still valid.
//
// Returns the session record, or null if no session matches.
// ============================================================
export async function findSessionByTokenHash(tokenHash: string) {
  // prisma.session.findUnique() finds a single record by a unique field.
  // tokenHash is unique because each refresh token is unique.
  return prisma.session.findUnique({
    where: { tokenHash },
  });
}

// ============================================================
// REVOKE SESSION
// ============================================================
// Called on logout. We set the revokedAt timestamp on the session.
// Once revoked, the refresh token can no longer be used to get
// new access tokens.
//
// Returns the updated session record.
// ============================================================
export async function revokeSession(id: string) {
  // prisma.session.update() updates an existing record.
  // We set revokedAt to the current time, marking it as revoked.
  return prisma.session.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
}