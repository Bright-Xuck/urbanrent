import bcrypt from "bcryptjs";
import { createUser, findUserByEmail, findUserById } from "../repositories/userRepository.js";
import { createSession, findSessionByTokenHash, revokeSession } from "../repositories/sessionRepository.js";
import { Role } from "../../generated/prisma/enums.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashRefreshToken } from "../utils/token.js";

// ============================================================
// USER SERVICE - Business Logic Layer
// ============================================================
// This is where we decide WHAT to do. The repositories handle
// HOW to talk to the DB. The controllers handle HTTP.
//
// There are only 4 functions here:
//   1. registerUser       - create a new account (no tokens yet)
//   2. loginUser          - verify credentials, give back BOTH tokens
//   3. refreshAccessToken - get a NEW access token using the refresh token
//   4. logoutUser         - kill the session so refresh token is dead
// ============================================================

// ------------------------------------------------------------
// REGISTER - just creates the user, no tokens yet.
// ------------------------------------------------------------
export async function registerUser(data: { email: string; password: string }) {
  // 1. Make sure the email isn't already taken
  const existing = await findUserByEmail(data.email);
  if (existing) throw new Error("User with this email already exists");

  // 2. Hash the password so we never store plain text
  const passwordHash = await bcrypt.hash(data.password, 10);

  // 3. Create the user (always TENANT for now)
  return createUser({
    email: data.email,
    passwordHash,
    role: Role.TENANT,
  });
}

// ------------------------------------------------------------
// LOGIN - verify credentials, then issue BOTH tokens.
// ------------------------------------------------------------
export async function loginUser(data: { email: string; password: string }) {
  // 1. Find the user by email
  const user = await findUserByEmail(data.email);
  if (!user) throw new Error("Invalid email or password");

  // 2. Check the password matches the stored hash
  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) throw new Error("Invalid email or password");

  // 3. Create the ACCESS token (15 min, sent on API calls)
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // 4. Create the REFRESH token (7 days, only for getting new access tokens)
  const refreshToken = signRefreshToken({ userId: user.id });

  // 5. Remember this refresh token so we can revoke it on logout.
  //    We store a HASH, never the raw token.
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  await createSession({
    userId: user.id,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt,
  });

  // 6. Give the client everything they need
  return { user, accessToken, refreshToken };
}

// ------------------------------------------------------------
// REFRESH ACCESS TOKEN - called when access token has expired.
// Client sends the refresh token, we give back a NEW access token.
// ------------------------------------------------------------
export async function refreshAccessToken(refreshToken: string) {
  // 1. Check the refresh token is real (signed by us, not expired)
  const payload = verifyRefreshToken(refreshToken);

  // 2. Look up the session in the DB. We stored the HASH when logging in,
  //    so we hash the incoming token and compare.
  const tokenHash = hashRefreshToken(refreshToken);
  const session = await findSessionByTokenHash(tokenHash);
  if (!session) throw new Error("Invalid refresh token");

  // 3. Make sure the session isn't revoked (user didn't log out)
  if (session.revokedAt) throw new Error("Refresh token has been revoked");

  // 4. Make sure the refresh token isn't expired (past 7 days)
  if (session.expiresAt < new Date()) throw new Error("Refresh token has expired");

  // 5. Load the user so we can build a fresh access token
  const user = await findUserById(payload.userId);
  if (!user) throw new Error("User not found");

  // 6. Create a NEW access token (old one is dead now)
  const newAccessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return { accessToken: newAccessToken, user };
}

// ------------------------------------------------------------
// LOGOUT - revoke the session so the refresh token is useless.
// ------------------------------------------------------------
export async function logoutUser(refreshToken: string) {
  // 1. Find the session by hashing the refresh token
  const tokenHash = hashRefreshToken(refreshToken);
  const session = await findSessionByTokenHash(tokenHash);
  if (!session) throw new Error("Invalid refresh token");

  // 2. Mark it as revoked. After this, the refresh token
  //    can no longer be used to get a new access token.
  await revokeSession(session.id);
}