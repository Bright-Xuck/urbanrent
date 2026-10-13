import type { Request, Response } from "express";
import type { PropertyReportReason, PropertyReportStatus, PropertyStatus } from "../../generated/prisma/enums.js";
import {
  getReports,
  reportProperty,
  reviewReport,
} from "../services/reportService.js";
import { moderateProperty } from "../services/propertyService.js";
import { readPagination } from "../utils/pagination.js";

const REPORT_REASONS = ["SCAM_OR_FRAUD", "MISLEADING_INFORMATION", "ALREADY_RENTED", "OTHER"];
const REPORT_STATUSES = ["OPEN", "REVIEWED", "DISMISSED"];
const MODERATION_ACTIONS = ["UNPUBLISHED", "ARCHIVED"];

// POST /api/properties/:propertyId/reports — tenant flags a listing.
export async function CreateReport(req: Request, res: Response) {
  const reporterId = req.user?.userId;
  if (!reporterId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const { propertyId } = req.params;
  if (typeof propertyId !== "string") {
    res.status(400).json({ message: "Invalid property id" });
    return;
  }

  const { reason } = req.body;
  if (!REPORT_REASONS.includes(reason)) {
    res.status(400).json({
      message: "reason must be SCAM_OR_FRAUD, MISLEADING_INFORMATION, ALREADY_RENTED or OTHER",
    });
    return;
  }

  try {
    const report = await reportProperty(
      reporterId,
      propertyId,
      reason as PropertyReportReason
    );
    res.status(201).json({
      message: "Report submitted. Our team will review this listing.",
      report,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Property not found") {
        res.status(404).json({ message: error.message });
        return;
      }
      if (error.message.includes("already reported")) {
        res.status(400).json({ message: error.message });
        return;
      }
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/admin/reports?offset=0&limit=10&status=OPEN
export async function GetReports(req: Request, res: Response) {
  const pagination = readPagination(req);
  if (!pagination) {
    res.status(400).json({ message: "offset must be >= 0 and limit must be >= 1" });
    return;
  }
  const { offset, limit } = pagination;

  const { status } = req.query;
  if (status !== undefined && !REPORT_STATUSES.includes(status as string)) {
    res.status(400).json({ message: "status must be OPEN, REVIEWED or DISMISSED" });
    return;
  }

  try {
    const result = await getReports(
      status as PropertyReportStatus | undefined,
      offset,
      limit
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

// PATCH /api/admin/reports/:id/review — close a report. Does NOT touch
// the listing: taking a listing down is the separate moderate action.
export async function ReviewReport(req: Request, res: Response) {
  const { id } = req.params;
  if (typeof id !== "string") {
    res.status(400).json({ message: "Invalid report id" });
    return;
  }

  const { decision } = req.body;
  if (decision !== "REVIEWED" && decision !== "DISMISSED") {
    res.status(400).json({ message: 'decision must be "REVIEWED" or "DISMISSED"' });
    return;
  }

  try {
    const report = await reviewReport(id, decision);
    res.status(200).json({
      message:
        decision === "REVIEWED"
          ? "Report marked as reviewed."
          : "Report dismissed.",
      report,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Report not found") {
        res.status(404).json({ message: error.message });
        return;
      }
      if (error.message.includes("already been reviewed")) {
        res.status(400).json({ message: error.message });
        return;
      }
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// PATCH /api/admin/properties/:id/moderate — admin takes a listing down.
// UNPUBLISHED or ARCHIVED (soft states — nothing is ever hard-deleted).
export async function ModerateProperty(req: Request, res: Response) {
  const { id } = req.params;
  if (typeof id !== "string") {
    res.status(400).json({ message: "Invalid property id" });
    return;
  }

  const { action } = req.body;
  if (!MODERATION_ACTIONS.includes(action)) {
    res.status(400).json({ message: 'action must be "UNPUBLISHED" or "ARCHIVED"' });
    return;
  }

  try {
    const property = await moderateProperty(id, action as PropertyStatus);
    res.status(200).json({
      message: action === "ARCHIVED"
        ? "Listing archived."
        : "Listing unpublished.",
      property,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Property not found") {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
}
