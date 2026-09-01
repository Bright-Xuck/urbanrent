import { PropertyStatus, Role, ViewingRequestStatus } from "../../generated/prisma/enums.js";
import { findPropertyById } from "../repositories/propertyRepository.js";
import {
  confirmViewingWithoutConflicts,
  createViewingRequest,
  findViewingRequestById,
  findViewingRequestsByTenant,
  updateViewingRequestStatus,
} from "../repositories/viewingRequestRepository.js";

// ============================================================
// VIEWING REQUEST SERVICE - Business Logic Layer
// ============================================================
//   1. Two-party access control (tenant owns their request; landlord
//      owns the property the request targets).
//   2. The ViewingRequestStatus state machine.
//   3. CREATE guards: tenant only, property must be PUBLISHED.
//
// NOTE: confirming a viewing is ATOMIC — confirmViewingWithoutConflicts
// (in the repository) runs the calendar check inside one transaction
// with a pessimistic row lock, so two confirms for the same landlord
// can never double-book the same time slot.
// ============================================================

// Transition matrix. Landlord/admin drive all of these.
const ALLOWED_TRANSITIONS: Record<ViewingRequestStatus, ViewingRequestStatus[]> = {
  REQUESTED: [
    ViewingRequestStatus.CONFIRMED,
    ViewingRequestStatus.DECLINED,
  ],
  CONFIRMED: [
    ViewingRequestStatus.COMPLETED,
    ViewingRequestStatus.NO_SHOW,
  ],
  DECLINED: [],
  COMPLETED: [],
  NO_SHOW: [],
};

// How close two confirmed viewings may be before the second one is
// blocked. 60 minutes ≈ how long a viewing takes. To change the rule
// later (e.g. make it neighborhood-aware), change this one spot.
const VIEWING_CONFLICT_MS = 60 * 60 * 1000; // 60 minutes, in milliseconds

// ------------------------------------------------------------
// CREATE VIEWING REQUEST (tenant only)
// ------------------------------------------------------------
export async function createViewingRequestByTenant(
  tenantId: string,
  propertyId: string,
  proposedTimes: string[]
) {
  // 1. Property must exist and be accepting viewing requests.
  const property = await findPropertyById(propertyId);
  if (!property) throw new Error("Property not found");
  if (property.status !== PropertyStatus.PUBLISHED) {
    throw new Error("This property is not accepting viewing requests");
  }

  // 2. Basic validation: at least one proposed time.
  if (!proposedTimes || proposedTimes.length === 0) {
    throw new Error("At least one proposed time is required");
  }

  // 3. Create. proposedTimes is an array of ISO strings.
  return createViewingRequest({ propertyId, tenantId, proposedTimes });
}

// ------------------------------------------------------------
// GET MY VIEWING REQUESTS (tenant)
// ------------------------------------------------------------
export async function getMyViewingRequests(tenantId: string) {
  return findViewingRequestsByTenant(tenantId);
}

// ------------------------------------------------------------
// GET VIEWING REQUEST BY ID (two-party access control)
// ------------------------------------------------------------
export async function getViewingRequestById(
  id: string,
  userId: string,
  role: string
) {
  const request = await findViewingRequestById(id);
  if (!request) throw new Error("Viewing request not found");

  const isTenant = request.tenantId === userId;
  const isOwner = request.property.ownerId === userId;
  const isAdmin = role === Role.ADMIN;

  if (!isTenant && !isOwner && !isAdmin) {
    throw new Error("You do not have permission to view this viewing request");
  }

  return request;
}

// ------------------------------------------------------------
// CHANGE VIEWING REQUEST STATUS
// ------------------------------------------------------------
// Only the property owner (or admin) can drive status changes.
// The transition matrix governs which moves are allowed.
// ------------------------------------------------------------
export async function changeViewingRequestStatus(
  id: string,
  next: ViewingRequestStatus,
  actor: { userId: string; role: string },
  confirmedTime?: Date
) {
  const request = await findViewingRequestById(id);
  if (!request) throw new Error("Viewing request not found");

  // Only the property owner or an admin may change a viewing's status.
  const isOwner = request.property.ownerId === actor.userId;
  const isAdmin = actor.role === Role.ADMIN;
  if (!isOwner && !isAdmin) {
    throw new Error("You do not have permission to change this viewing request");
  }

  // Check the requested transition is allowed from the current status.
  const current = request.status;
  const allowed = ALLOWED_TRANSITIONS[current] ?? [];
  if (!allowed.includes(next)) {
    throw new Error(`Cannot move viewing request from ${current} to ${next}`);
  }

  // If we're CONFIRMING, set the confirmed time.
  if (next === ViewingRequestStatus.CONFIRMED) {
    if (!confirmedTime) {
      throw new Error("A confirmed time is required to confirm a viewing");
    }
    // Confirm atomically: the repository runs lock → re-read → calendar
    // check → write inside ONE transaction, so two confirms for the same
    // landlord can never slip past the check (TOCTOU).
    // Throws "overlaps ..." → the controller returns 409 Conflict.
    return confirmViewingWithoutConflicts(
      request.property.ownerId,
      id,
      confirmedTime, // narrowed to Date by the guard above
      VIEWING_CONFLICT_MS
    );
  }

  return updateViewingRequestStatus(id, next, confirmedTime);
}