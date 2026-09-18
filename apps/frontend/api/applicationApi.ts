import { useAuthStore } from "../Store/useUserStore";
import type { Application, ApplicationStatus } from "./types";

// ============================================================
// APPLICATION API
// ============================================================
// Applications live on two different URLs on the backend:
//   POST /api/properties/:propertyId/applications   (create)
//   GET|PATCH /api/applications/...                 (read + update)
//
// Both are wrapped here so the rest of the app doesn't have to care.
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ------------------------------------------------------------
// CREATE — POST /api/properties/:propertyId/applications (tenant only)
// ------------------------------------------------------------
// `note` is optional. Things that can go wrong:
//   404 → the property does not exist
//   400 → the property is not PUBLISHED, so it takes no applications
//   409 → you already have an active application for this property
export async function createApplication(
  propertyId: string,
  note?: string
): Promise<Application> {
  const token = useAuthStore.getState().accessToken;

  const response = await fetch(`${API_URL}/properties/${propertyId}/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    // Only send note when we have one. The backend saves null otherwise.
    body: JSON.stringify(note ? { note } : {}),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not send your application");
  }

  // The backend wraps it: { message, application }
  return data.application;
}

// ------------------------------------------------------------
// MY APPLICATIONS — GET /api/applications/mine
// ------------------------------------------------------------
// Each one comes with the full property it was made against.
export async function getMyApplications(): Promise<Application[]> {
  const token = useAuthStore.getState().accessToken;

  const response = await fetch(`${API_URL}/applications/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not load your applications");
  }

  return data.applications;
}

// ------------------------------------------------------------
// INCOMING — GET /api/applications/incoming (landlord/admin only)
// ------------------------------------------------------------
// Every application submitted to ANY property the caller owns, with the
// applicant (tenant) included. A tenant calling this gets a 403.
export async function getIncomingApplications(): Promise<Application[]> {
  const token = useAuthStore.getState().accessToken;

  const response = await fetch(`${API_URL}/applications/incoming`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not load incoming applications");
  }

  return data.applications;
}

// ------------------------------------------------------------
// SINGLE — GET /api/applications/:id
// ------------------------------------------------------------
// Only the applicant, the property owner, or an admin can see it.
export async function getApplicationById(id: string): Promise<Application> {
  const token = useAuthStore.getState().accessToken;

  const response = await fetch(`${API_URL}/applications/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not load this application");
  }

  return data.application;
}

// ------------------------------------------------------------
// CHANGE STATUS — PATCH /api/applications/:id/status
// ------------------------------------------------------------
// Who is allowed to do what:
//   TENANT   → only WITHDRAWN, and only on their own application
//   LANDLORD → UNDER_REVIEW / APPROVED / REJECTED, on their own property
//   ADMIN    → any of them
//
// APPROVED / REJECTED / WITHDRAWN are final. Trying to move one of those
// again returns a 400.
export async function changeApplicationStatus(
  id: string,
  status: ApplicationStatus
): Promise<Application> {
  const token = useAuthStore.getState().accessToken;

  const response = await fetch(`${API_URL}/applications/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not change the application status");
  }

  return data.application;
}

// ---- Short helpers, one per action, so UI code reads clearly ----

// Tenant: pull my own application.
export function withdrawApplication(id: string): Promise<Application> {
  return changeApplicationStatus(id, "WITHDRAWN");
}

// Landlord: start reviewing, approve, or reject.
export function reviewApplication(id: string): Promise<Application> {
  return changeApplicationStatus(id, "UNDER_REVIEW");
}

export function approveApplication(id: string): Promise<Application> {
  return changeApplicationStatus(id, "APPROVED");
}

export function rejectApplication(id: string): Promise<Application> {
  return changeApplicationStatus(id, "REJECTED");
}
