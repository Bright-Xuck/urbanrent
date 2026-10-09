import type { Request, Response } from "express";
import type { AccountState, Role } from "../../generated/prisma/enums.js";
import type { UserFilters } from "../repositories/userRepository.js";
import {
  listUsers,
  getUserById,
  suspendUser,
  reinstateUser,
} from "../services/adminService.js";

// ADMIN CONTROLLER - HTTP layer for the admin user-management routes.

// GET /api/admin/users?offset=0&limit=10&role=LANDLORD&accountState=SUSPENDED
export async function GetUsers(req: Request, res: Response) {
  const offset = Number(req.query.offset) || 0;
  const limit = Number(req.query.limit) || 10;
  if (offset < 0 || limit < 1) {
    res.status(400).json({ message: "offset must be >= 0 and limit must be >= 1" });
    return;
  }

  const { role, accountState } = req.query;
  const filters: UserFilters = {};

  if (role) {
    if (!isRole(role as string)) {
      res.status(400).json({ message: "role must be TENANT, LANDLORD or ADMIN" });
      return;
    }
    filters.role = role as Role;
  }

  if (accountState) {
    if (!isAccountState(accountState as string)) {
      res.status(400).json({ message: "accountState must be ACTIVE or SUSPENDED" });
      return;
    }
    filters.accountState = accountState as AccountState;
  }

  try {
    const result = await listUsers(filters, offset, limit);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/admin/users/:id
export async function GetUserById(req: Request, res: Response) {
  const { id } = req.params;
  if (typeof id !== "string") {
    res.status(400).json({ message: "Invalid user id" });
    return;
  }

  try {
    const user = await getUserById(id);
    const { passwordHash, ...safeUser } = user;
    res.status(200).json({ user: safeUser });
  } catch (error) {
    if (error instanceof Error && error.message === "User not found") {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// PATCH /api/admin/users/:id/suspend
export async function SuspendUser(req: Request, res: Response) {
  await changeAccountState(req, res, "suspend");
}

// PATCH /api/admin/users/:id/reinstate
export async function ReinstateUser(req: Request, res: Response) {
  await changeAccountState(req, res, "reinstate");
}

async function changeAccountState(req: Request, res: Response, action: "suspend" | "reinstate") {
  const adminId = req.user?.userId;
  if (!adminId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const { id } = req.params;
  if (typeof id !== "string") {
    res.status(400).json({ message: "Invalid user id" });
    return;
  }

  try {
    const user =
      action === "suspend"
        ? await suspendUser(adminId, id)
        : await reinstateUser(adminId, id);

    const { passwordHash, ...safeUser } = user;
    const message =
      action === "suspend" ? "User suspended successfully" : "User reinstated successfully";
    res.status(200).json({ message, user: safeUser });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "User not found") {
        res.status(404).json({ message: error.message });
        return;
      }
      if (error.message.includes("your own account")) {
        res.status(403).json({ message: error.message });
        return;
      }
      if (error.message.includes("already")) {
        res.status(400).json({ message: error.message });
        return;
      }
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

function isRole(value: string): boolean {
  return ["TENANT", "LANDLORD", "ADMIN"].includes(value);
}

function isAccountState(value: string): boolean {
  return ["ACTIVE", "SUSPENDED"].includes(value);
}
