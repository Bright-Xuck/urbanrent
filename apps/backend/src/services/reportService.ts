import {
  createReport,
  findOpenReport,
  findReportById,
  findReports,
  updateReportStatus,
  type CreateReportInput,
} from "../repositories/reportRepository.js";
import { findPropertyById } from "../repositories/propertyRepository.js";
import type { PropertyReportReason, PropertyReportStatus } from "../../generated/prisma/enums.js";

// Tenant flags a listing. The property must exist; the duplicate rule
// (one OPEN report per reporter per property) lives here, in the service,
// because the schema deliberately has no @@unique for it.
export async function reportProperty(
  reporterId: string,
  propertyId: string,
  reason: PropertyReportReason
) {
  const property = await findPropertyById(propertyId);
  if (!property) throw new Error("Property not found");

  const existing = await findOpenReport(reporterId, propertyId);
  if (existing) {
    throw new Error("You have already reported this listing");
  }

  const input: CreateReportInput = { reporterId, propertyId, reason };
  return createReport(input);
}

// Admin closes a report. This ONLY flips the report's own status —
// taking the listing down (or not) is a separate admin action
// (moderateProperty), so "reviewed, unfounded" stays possible.
export async function reviewReport(
  reportId: string,
  decision: Extract<PropertyReportStatus, "REVIEWED" | "DISMISSED">
) {
  const report = await findReportById(reportId);
  if (!report) throw new Error("Report not found");
  if (report.status !== "OPEN") {
    throw new Error("This report has already been reviewed");
  }

  return updateReportStatus(reportId, decision);
}

export async function getReports(
  status: PropertyReportStatus | undefined,
  offset: number,
  limit: number
) {
  return findReports(status, offset, limit);
}
