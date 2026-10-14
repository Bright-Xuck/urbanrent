import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import {
  createGoogleUser,
  createUser,
  findUserByEmail,
  findUserByEmailInsensitive,
  findUserByGoogleId,
  findUserById,
  linkGoogleAccount,
} from "../repositories/userRepository.js";
import { createSession, findSessionByTokenHash, revokeSession } from "../repositories/sessionRepository.js";
import { Role } from "../../generated/prisma/enums.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashRefreshToken } from "../utils/token.js";

const googleOAuthClient = new OAuth2Client();

export class GoogleAuthenticationError extends Error {
  constructor(
    message: string,
    readonly statusCode: number
  ) {
    super(message);
    this.name = "GoogleAuthenticationError";
  }
}

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
export async function registerUser(data: { email: string; password: string, role: "TENANT"|"LANDLORD" }) {
  // 1. Make sure the email isn't already taken
  const existing = await findUserByEmail(data.email);
  if (existing) throw new Error("User with this email already exists");

  // 2. Hash the password so we never store plain text
  const passwordHash = await bcrypt.hash(data.password, 10);

  // 3. Create the user (always TENANT for now)
  return createUser({
    email: data.email,
    passwordHash,
    role: data.role,
  });
}

// ------------------------------------------------------------
// LOGIN - verify credentials, then issue BOTH tokens.
// ------------------------------------------------------------
export async function loginUser(data: { email: string; password: string }) {
  // 1. Find the user by email
  const user = await findUserByEmail(data.email);
  if (!user?.passwordHash) throw new Error("Invalid email or password");

  // 2. Check the password matches the stored hash
  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) throw new Error("Invalid email or password");

  return { user, ...(await createLoginSession(user)) };
}

export async function loginWithGoogle(
  credential: string,
  role?: "TENANT" | "LANDLORD"
) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new GoogleAuthenticationError("Google sign-in is not configured", 503);
  }

  let payload;
  try {
    const ticket = await googleOAuthClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw new GoogleAuthenticationError("Google credential is invalid or expired", 401);
  }

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw new GoogleAuthenticationError(
      "A Google account with a verified email address is required",
      403
    );
  }

  let user = await findUserByGoogleId(payload.sub);
  let created = false;

  if (!user) {
    const existingUser =
      (await findUserByEmail(payload.email)) ??
      (await findUserByEmailInsensitive(payload.email));
    if (existingUser) {
      if (existingUser.googleId && existingUser.googleId !== payload.sub) {
        throw new GoogleAuthenticationError(
          "This email is already linked to a different Google account",
          409
        );
      }

      if (!existingUser.googleId) {
        try {
          await linkGoogleAccount(existingUser.id, payload.sub);
        } catch (error) {
          if (!isUniqueConstraintError(error)) throw error;
        }
      }
      user = await findUserByGoogleId(payload.sub);
      if (!user) {
        throw new GoogleAuthenticationError(
          "This Google account is already linked to another account",
          409
        );
      }
    } else {
      if (!role) {
        throw new GoogleAuthenticationError(
          "No account is registered with this Google account. Create an account first.",
          404
        );
      }

      try {
        user = await createGoogleUser({
          email: payload.email,
          googleId: payload.sub,
          role: role === "LANDLORD" ? Role.LANDLORD : Role.TENANT,
        });
        created = true;
      } catch (error) {
        if (!isUniqueConstraintError(error)) throw error;

        user = await findUserByGoogleId(payload.sub);
        if (!user) {
          const racedUser =
            (await findUserByEmail(payload.email)) ??
            (await findUserByEmailInsensitive(payload.email));
          if (racedUser) {
            if (racedUser.googleId && racedUser.googleId !== payload.sub) {
              throw new GoogleAuthenticationError(
                "This email is already linked to a different Google account",
                409
              );
            }
            if (!racedUser.googleId) {
              try {
                await linkGoogleAccount(racedUser.id, payload.sub);
              } catch (linkError) {
                if (!isUniqueConstraintError(linkError)) throw linkError;
              }
            }
            user = await findUserByGoogleId(payload.sub);
          }
        }
        if (!user) throw error;
      }
    }
  }

  if (user.accountState === "SUSPENDED") {
    throw new GoogleAuthenticationError("This account is suspended", 403);
  }

  return {
    user,
    ...(await createLoginSession(user)),
    created,
  };
}

async function createLoginSession(user: { id: string; email: string; role: string }) {
  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = signRefreshToken({ userId: user.id });
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await createSession({
    userId: user.id,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt,
  });

  return { accessToken, refreshToken };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
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