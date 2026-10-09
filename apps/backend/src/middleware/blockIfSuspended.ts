import type { Request, Response, NextFunction } from "express";
import { findUserById } from "../repositories/userRepository.js";

// ============================================================
// BLOCK IF SUSPENDED
// ============================================================
// Sits right after `authenticate` on every route that CREATES or
// CHANGES data (POST/PATCH/DELETE). GET routes skip it on purpose:
// a suspended user can still look at their own data, they just
// cannot act. That is the "can view, can't act" boundary.
// ============================================================
export async function blockIfSuspended(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  try {
    const user = await findUserById(userId);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    if (user.accountState === "SUSPENDED") {
      res.status(403).json({ message: "Your account is suspended" });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}
