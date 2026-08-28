import type { Request, Response } from "express";
import {
  createViewingRequestByTenant,
  getMyViewingRequests,
  getViewingRequestById,
  changeViewingRequestStatus,
} from "../services/viewingRequestService.js";
import { ViewingRequestStatus } from "../../generated/prisma/enums.js";

// ============================================================
// VIEWING REQUEST CONTROLLER
// ============================================================
// Thin HTTP layer: reads the request, calls the service, maps
// errors to status codes. No business logic.
// ============================================================

// ------------------------------------------------------------
// CREATE VIEWING REQUEST (tenant only)
// ------------------------------------------------------------
// POST /api/properties/:propertyId/viewing-requests
// Body: { proposedTimes: string[] }
// ------------------------------------------------------------
export async function CreateViewingRequest(req: Request, res: Response) {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }
  // Role-gating (TENANT only) is enforced by the requireRole(Role.TENANT)
  // RBAC middleware on the route — no longer re-checked here.

  const { propertyId } = req.params;
  if (typeof propertyId !== "string") {
    res.status(400).json({ message: "Invalid property id" });
    return;
  }

  const { proposedTimes } = req.body;

  try {
    const request = await createViewingRequestByTenant(userId, propertyId, proposedTimes);
    res.status(201).json({ message: "Viewing request submitted", request });
  } catch (error) {
    if (error instanceof Error && error.message === "Property not found") {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error instanceof Error && (error.message.includes("not accepting") || error.message.includes("At least one proposed"))) {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// ------------------------------------------------------------
// GET MY VIEWING REQUESTS (tenant's own)
// ------------------------------------------------------------
// GET /api/viewing-requests/mine
// ------------------------------------------------------------
export async function GetMyViewingRequests(req: Request, res: Response) {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  try {
    const requests = await getMyViewingRequests(userId);
    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

// ------------------------------------------------------------
// GET VIEWING REQUEST BY ID
// ------------------------------------------------------------
// GET /api/viewing-requests/:id
// Visible to: the tenant OR the property owner/admin.
// ------------------------------------------------------------
export async function GetViewingRequestById(req: Request, res: Response) {
  const userId = req.user?.userId;
  const role = req.user?.role;
  if (!userId || !role) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const { id } = req.params;
  if (typeof id !== "string") {
    res.status(400).json({ message: "Invalid viewing request id" });
    return;
  }

  try {
    const request = await getViewingRequestById(id, userId, role);
    res.status(200).json({ request });
  } catch (error) {
    if (error instanceof Error && error.message === "Viewing request not found") {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error instanceof Error && error.message.includes("permission")) {
      res.status(403).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// ------------------------------------------------------------
// CHANGE VIEWING REQUEST STATUS
// ------------------------------------------------------------
// PATCH /api/viewing-requests/:id/status
// Body: { status, confirmedTime? }
// Property owner/admin only, per the transition matrix.
// ------------------------------------------------------------
export async function ChangeViewingRequestStatus(req: Request, res: Response) {
  const userId = req.user?.userId;
  const role = req.user?.role;
  if (!userId || !role) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const { id } = req.params;
  if (typeof id !== "string") {
    res.status(400).json({ message: "Invalid viewing request id" });
    return;
  }

  const { status, confirmedTime } = req.body;
  if (!Object.values(ViewingRequestStatus).includes(status)) {
    res.status(400).json({ message: "Invalid status value" });
    return;
  }

  try {
    const request = await changeViewingRequestStatus(
      id,
      status,
      { userId, role },
      confirmedTime ? new Date(confirmedTime) : undefined
    );
    res.status(200).json({ message: "Viewing request updated", request });
  } catch (error) {
    if (error instanceof Error && error.message === "Viewing request not found") {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error instanceof Error && error.message.includes("permission")) {
      res.status(403).json({ message: error.message });
      return;
    }
    if (error instanceof Error && (error.message.includes("Cannot move") || error.message.includes("confirmed time"))) {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
}