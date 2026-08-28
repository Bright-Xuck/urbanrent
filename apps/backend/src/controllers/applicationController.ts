import type { Request, Response } from "express";
import {
  createApplicationByTenant,
  getMyApplicationsByTenant,
  getApplicationById,
  changeApplicationStatus,
} from "../services/applicationService.js";
import { ApplicationStatus } from "../../generated/prisma/enums.js";

// ============================================================
// APPLICATION CONTROLLER
// ============================================================
// Thin HTTP layer: reads the request, calls the service, maps
// errors to status codes. No business logic here.
// ============================================================

// ------------------------------------------------------------
// CREATE APPLICATION (tenant only)
// ------------------------------------------------------------
// POST /api/properties/:propertyId/applications
// Body: { note? }
// ------------------------------------------------------------
export async function CreateApplication(req: Request, res: Response) {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }
  // Role-gating (TENANT only) is handled by the requireRole(Role.TENANT)
  // RBAC middleware on the route — no need to re-check the role here.

  const { propertyId } = req.params;
  if (typeof propertyId !== "string") {
    res.status(400).json({ message: "Invalid property id" });
    return;
  }

  const { note } = req.body;

  try {
    const application = await createApplicationByTenant(userId, propertyId, note);
    res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("already have an active application")) {
      res.status(409).json({ message: error.message });
      return;
    }
    if (error instanceof Error && error.message.includes("not accepting")) {
      res.status(400).json({ message: error.message });
      return;
    }
    if (error instanceof Error && error.message === "Property not found") {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// ------------------------------------------------------------
// GET MY APPLICATIONS (tenant's own submissions)
// ------------------------------------------------------------
// GET /api/applications/mine
// ------------------------------------------------------------
export async function GetMyApplications(req: Request, res: Response) {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  try {
    const applications = await getMyApplicationsByTenant(userId);
    res.status(200).json({ applications });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

// ------------------------------------------------------------
// GET APPLICATION BY ID
// ------------------------------------------------------------
// GET /api/applications/:id
// Visible to: the applicant (tenant) OR the property owner/admin.
// ------------------------------------------------------------
export async function GetApplicationById(req: Request, res: Response) {
  const userId = req.user?.userId;
  const role = req.user?.role;
  if (!userId || !role) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const { id } = req.params;
  if (typeof id !== "string") {
    res.status(400).json({ message: "Invalid application id" });
    return;
  }

  try {
    const application = await getApplicationById(id, userId, role);
    res.status(200).json({ application });
  } catch (error) {
    if (error instanceof Error && error.message === "Application not found") {
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
// CHANGE APPLICATION STATUS
// ------------------------------------------------------------
// PATCH /api/applications/:id/status
// Body: { status: ApplicationStatus }
// - TENANT: only allowed to WITHDRAW their own application.
// - LANDLORD/ADMIN: can move to UNDER_REVIEW/APPROVED/REJECTED.
// ------------------------------------------------------------
export async function ChangeApplicationStatus(req: Request, res: Response) {
  const userId = req.user?.userId;
  const role = req.user?.role;
  if (!userId || !role) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const { id } = req.params;
  if (typeof id !== "string") {
    res.status(400).json({ message: "Invalid application id" });
    return;
  }

  const { status } = req.body;
  // Reject anything that isn't a real ApplicationStatus value.
  if (!Object.values(ApplicationStatus).includes(status)) {
    res.status(400).json({ message: "Invalid status value" });
    return;
  }

  try {
    const application = await changeApplicationStatus(id, status, { userId, role });
    res.status(200).json({ message: "Application updated", application });
  } catch (error) {
    if (error instanceof Error && error.message === "Application not found") {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error instanceof Error && error.message.includes("permission")) {
      res.status(403).json({ message: error.message });
      return;
    }
    if (error instanceof Error && error.message.includes("Cannot move")) {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
}