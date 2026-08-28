import { PropertyStatus, Role, ViewingRequestStatus } from "../../generated/prisma/enums.js";
import { findPropertyById } from "../repositories/propertyRepository.js";
import {
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
// NOTE: the "confirm with no overlapping times" check is a
// CONCURRENCY / TRANSACTION exercise — deliberately left as a marked
// TODO at the bottom of this file for you to implement. See
// `confirmViewing` below.
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
    // ═══════════════════════════════════════════════════════════
    // CONCURRENCY EXERCISE (you implement this):
    // Before confirming, you should verify that `confirmedTime` does
    // NOT overlap another already-CONFIRMED viewing on the SAME
    // property. If it does, throw an error (→ 409 in the controller).
    //
    // This must be done inside a TRANSACTION with a ROW LOCK to avoid
    // the TOCTOU race (read → check → write where another request
    // slips in between). See the write-up I gave you.
    //
    // Right now it just confirms without the overlap check.
    // ═══════════════════════════════════════════════════════════
  }

  return updateViewingRequestStatus(id, next, confirmedTime);
}