import { useAuthStore } from "../Store/useUserStore";
import type {
  PaginatedReports,
  Property,
  PropertyReport,
  PropertyReportReason,
  PropertyReportStatus,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type ReviewDecision = "REVIEWED" | "DISMISSED";
export type ModerationAction = "UNPUBLISHED" | "ARCHIVED";

// ------------------------------------------------------------
// REPORT — POST /api/properties/:propertyId/reports (tenant)
// ------------------------------------------------------------
export async function reportProperty(
  propertyId: string,
  reason: PropertyReportReason
): Promise<PropertyReport> {
  const token = useAuthStore.getState().accessToken;
  const response = await fetch(`${API_URL}/properties/${propertyId}/reports`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not submit your report");
  }

  return data.report;
}

// ------------------------------------------------------------
// ADMIN QUEUE — GET /api/admin/reports
// ------------------------------------------------------------
export async function getReports(
  status?: PropertyReportStatus,
  offset = 0,
  limit = 10
): Promise<PaginatedReports> {
  const token = useAuthStore.getState().accessToken;
  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  });
  if (status) params.set("status", status);

  const response = await fetch(`${API_URL}/admin/reports?${params}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not load the reports");
  }

  return data;
}

// ------------------------------------------------------------
// ADMIN REVIEW — PATCH /api/admin/reports/:id/review
// ------------------------------------------------------------
// Closes the report only. Taking the listing down is the separate
// moderateProperty call — review and takedown are independent.
export async function reviewReport(
  id: string,
  decision: ReviewDecision
): Promise<PropertyReport> {
  const token = useAuthStore.getState().accessToken;
  const response = await fetch(`${API_URL}/admin/reports/${id}/review`, {
    method: "PATCH",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ decision }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not review the report");
  }

  return data.report;
}

// ------------------------------------------------------------
// ADMIN MODERATE — PATCH /api/admin/properties/:id/moderate
// ------------------------------------------------------------
// Unpublish or archive a listing (admin bypasses ownership — the
// backend route enforces the ADMIN role).
export async function moderateProperty(
  id: string,
  action: ModerationAction
): Promise<Property> {
  const token = useAuthStore.getState().accessToken;
  const response = await fetch(`${API_URL}/admin/properties/${id}/moderate`, {
    method: "PATCH",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not moderate the listing");
  }

  return data.property;
}
