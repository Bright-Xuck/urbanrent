import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/token.js";

// ============================================================
// AUTHENTICATE MIDDLEWARE
// ============================================================
// This middleware protects routes that require authentication.
// It runs BEFORE the route handler and does 3 things:
//   1. Extracts the access token from the Authorization header
//   2. Verifies the token is valid (not tampered with, not expired)
//   3. Attaches the user info to the request so the route handler can use it
//
// If any step fails, it responds with 401 and does NOT call next(),
// which means the route handler never runs.
//
// How to use it on a protected route:
//   router.get('/profile', authenticate, getProfile)
// ============================================================

// We extend Express's Request type to add a `user` property.
// This lets us do `req.user.userId` inside protected route handlers.
// Without this, TypeScript wouldn't know `req.user` exists.
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  // ============================================================
  // STEP 1: Extract the token from the Authorization header
  // ============================================================
  // The client sends the access token in the Authorization header like this:
  //   Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
  //
  // We read the header, then split it on the space to get ["Bearer", "eyJhbGci..."].
  // The token is the second part (index 1).
  const authHeader = req.headers.authorization;

  // If there's no Authorization header at all, reject the request.
  if (!authHeader) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  // Split "Bearer <token>" into parts and take the token.
  // The `?.[1]` safely handles the case where the header is malformed.
  const token = authHeader.split(" ")[1];

  // If the token part is missing (e.g. header was just "Bearer"), reject.
  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  // ============================================================
  // STEP 2: Verify the token
  // ============================================================
  try {
    // verifyAccessToken checks the signature and expiry.
    // If the token is invalid/expired/tampered, it throws an error.
    const payload = verifyAccessToken(token);

    // ============================================================
    // STEP 3: Attach user info to the request
    // ============================================================
    // Now the route handler can access req.user.userId, req.user.email, etc.
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    // Call next() to pass control to the route handler.
    next();
  } catch (error) {
    // Token verification failed - it's expired, invalid, or tampered with.
    res.status(401).json({ message: "Invalid or expired token" });
  }
}