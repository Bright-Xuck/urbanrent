import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/token.js";


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
  // STEP 1: Extract the token from the Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ message: "No token provided" });
    return;
  }
  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  try {
    
    const payload = verifyAccessToken(token);

    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    // Call next() to pass control to the route handler.
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

// ============================================================
// OPTIONAL AUTHENTICATE
// ============================================================
// For routes that are PUBLIC but behave differently for a signed-in
// visitor — the listing detail page is the example: anyone may read a
// published property, but the owner needs to be recognised to get their
// controls.
//
// Unlike `authenticate`, this NEVER answers 401:
//   valid token  -> req.user is set and the handler can use it
//   no/bad token -> req.user stays undefined and the request CONTINUES
//
// A logged-out visitor therefore still gets the page; the controller
// simply treats them as "not the owner". That is what makes the detail
// page readable without an account.
export function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
  // No Authorization header at all — the common case for a guest.
  if (!req.headers.authorization) {
    next();
    return;
  }

  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    // Expired or tampered token: fall through as a guest instead of
    // failing. The page is public, so there is nothing to protect here.
  }

  next();
}