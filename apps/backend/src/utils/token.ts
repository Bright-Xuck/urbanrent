import "dotenv/config";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";

// ============================================================
// TOKEN UTILITY
// ============================================================
// This file is the core of our JWT (JSON Web Token) system.
// It handles:
//   1. Signing (creating) access tokens
//   2. Signing (creating) refresh tokens
//   3. Verifying (checking) both types of tokens
//   4. Hashing refresh tokens for secure storage in the DB
//
// A JWT is a string made of 3 parts separated by dots:
//   header.payload.signature
// Example: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
//
// - header:  says which algorithm was used (HS256)
// - payload: the actual data we put in (userId, email, role, expiry)
// - signature: a cryptographic hash that proves the token wasn't tampered with
//
// The signature is created using a SECRET. Only our server knows this secret,
// so only our server can create valid tokens. If someone tries to change the
// payload (e.g. change role to ADMIN), the signature won't match anymore and
// verification will fail.
// ============================================================

// Read the secret keys from environment variables.
// These are loaded from the .env file by the "dotenv/config" import above.
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

// If either secret is missing, crash the app immediately.
// We NEVER want to run with missing secrets - it would be a security hole.
if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error("JWT secrets are not set in environment variables");
}

// How long each token lives.
// Access tokens are short-lived (15 min) so if stolen, the damage window is small.
// Refresh tokens live longer (7 days) but are stored in the DB so we can revoke them.
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

// ============================================================
// PAYLOAD TYPES
// ============================================================
// The "payload" is the data we embed inside the token.
// We only put non-sensitive data here - never passwords or hashes.
// The token is signed, not encrypted, so anyone can read the payload
// if they decode it. That's why we never put secrets in it.
// ============================================================

// What goes inside an access token
export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
}

// What goes inside a refresh token
// We only need the userId - the refresh token's job is just to
// prove "this user is who they say they are" so we can issue a new access token.
export interface RefreshTokenPayload {
  userId: string;
}

// ============================================================
// SIGNING (CREATING) TOKENS
// ============================================================

// Creates an access token for a user.
// "Signing" means we create the token AND cryptographically seal it with our secret.
export function signAccessToken(payload: AccessTokenPayload): string {
  // jwt.sign(payload, secret, options) returns the JWT string.
  // - payload: the data to embed
  // - secret:  the key used to create the signature
  // - expiresIn: how long the token is valid
  return jwt.sign(payload, ACCESS_TOKEN_SECRET!, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

// Creates a refresh token for a user.
export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET!, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

// ============================================================
// VERIFYING (CHECKING) TOKENS
// ============================================================

// Verifies an access token and returns its payload.
// Throws an error if the token is invalid, expired, or tampered with.
export function verifyAccessToken(token: string): AccessTokenPayload {
  // jwt.verify(token, secret) checks:
  //   1. The signature matches (token wasn't tampered with)
  //   2. The token isn't expired
  // If either fails, it throws an error.
  // We cast the result to AccessTokenPayload so TypeScript knows its shape.
  return jwt.verify(token, ACCESS_TOKEN_SECRET!) as AccessTokenPayload;
}

// Verifies a refresh token and returns its payload.
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, REFRESH_TOKEN_SECRET!) as RefreshTokenPayload;
}

// ============================================================
// HASHING REFRESH TOKENS FOR DB STORAGE
// ============================================================
// We store the refresh token in the Session table so we can revoke it on logout.
// But we NEVER store the raw token - if the DB leaked, attackers would have
// working refresh tokens. Instead we store a HASH of the token.
//
// A hash is a one-way function: you can turn a token into a hash,
// but you can't turn a hash back into the token. So even if the DB leaks,
// the hashes are useless to attackers.
//
// When a refresh token comes back to us, we hash it again and compare
// the hashes. If they match, the token is valid.
// ============================================================

// Creates a SHA-256 hash of a refresh token.
// SHA-256 is a cryptographic hash function - it always produces
// the same 64-character hex string for the same input.
export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}