import { useAuthStore } from "../Store/useUserStore";
import type { ViewingRequest, ViewingRequestStatus } from "./types";

// ============================================================
// VIEWING REQUEST API
// ============================================================
// Same two-URL split as applications:
//   POST /api/properties/:propertyId/viewing-requests  (create)
//   GET|PATCH /api/viewing-requests/...                (read + update)
//
// How it works: the tenant proposes one or more times, then the landlord
// confirms one of them or declines. After the viewing, the landlord marks
// it COMPLETED or NO_SHOW.
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ------------------------------------------------------------
// CREATE — POST /api/properties/:propertyId/viewing-requests (tenant only)
// ------------------------------------------------------------
// proposedTimes must be ISO 8601 strings, e.g. "2026-03-04T10:00:00.000Z".
// Things that can go wrong:
//   404 → the property does not exist
//   400 → the property is not PUBLISHED, or the list was empty
export async function createViewingRequest(
  propertyId: string,
  proposedTimes: string[]
): Promise<ViewingRequest> {
  const token = useAuthStore.getState().accessToken;

  const response = await fetch(`${API_URL}/properties/${propertyId}/viewing-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ proposedTimes }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not send your viewing request");
  }

  // The backend wraps it: { message, request }
  return data.request;
}

// ------------------------------------------------------------
// MY VIEWING REQUESTS — GET /api/viewing-requests/mine
// ------------------------------------------------------------
export async function getMyViewingRequests(): Promise<ViewingRequest[]> {
  const token = useAuthStore.getState().accessToken;

  const response = await fetch(`${API_URL}/viewing-requests/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not load your viewing requests");
  }

  return data.requests;
}

// ------------------------------------------------------------
// SINGLE — GET /api/viewing-requests/:id
// ------------------------------------------------------------
export async function getViewingRequestById(id: string): Promise<ViewingRequest> {
  const token = useAuthStore.getState().accessToken;

  const response = await fetch(`${API_URL}/viewing-requests/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not load this viewing request");
  }

  return data.request;
}

// ------------------------------------------------------------
// CHANGE STATUS — PATCH /api/viewing-requests/:id/status
// ------------------------------------------------------------
// Landlord or admin only — a tenant cannot confirm their own viewing.
// confirmedTime is REQUIRED when the new status is CONFIRMED.
//
// Careful: the backend rejects a time that clashes with another confirmed
// viewing for the same landlord. That comes back as a 409, so if you want
// to say "that slot is taken", check for that case.
export async function changeViewingRequestStatus(
  id: string,
  status: ViewingRequestStatus,
  confirmedTime?: string
): Promise<ViewingRequest> {
  const token = useAuthStore.getState().accessToken;

  const response = await fetch(`${API_URL}/viewing-requests/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    // Only include confirmedTime when we actually have one.
    body: JSON.stringify(confirmedTime ? { status, confirmedTime } : { status }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not change the viewing request status");
  }

  return data.request;
}

// ---- Short helpers, one per step of the flow ----

// REQUESTED → CONFIRMED. Pass the time you agreed on.
export function confirmViewing(id: string, confirmedTime: string): Promise<ViewingRequest> {
  return changeViewingRequestStatus(id, "CONFIRMED", confirmedTime);
}

// REQUESTED → DECLINED.
export function declineViewing(id: string): Promise<ViewingRequest> {
  return changeViewingRequestStatus(id, "DECLINED");
}

// CONFIRMED → COMPLETED.
export function completeViewing(id: string): Promise<ViewingRequest> {
  return changeViewingRequestStatus(id, "COMPLETED");
}

// CONFIRMED → NO_SHOW.
export function markViewingNoShow(id: string): Promise<ViewingRequest> {
  return changeViewingRequestStatus(id, "NO_SHOW");
}
