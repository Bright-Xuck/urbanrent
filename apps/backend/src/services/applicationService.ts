import { ApplicationStatus, PropertyStatus, Role } from "../../generated/prisma/enums.js";
import { findPropertyById } from "../repositories/propertyRepository.js";
import {
  createApplication,
  findActiveApplication,
  findApplicationById,
  findApplicationsByTenant,
  updateApplicationStatus,
} from "../repositories/applicationRepository.js";

// ============================================================
// APPLICATION SERVICE - Business Logic Layer
// ============================================================
// The interesting logic lives here:
//   1. "One active application per tenant per property" guard.
//   2. The ApplicationStatus state machine (restricted transitions).
//   3. Two-party access control (tenant owns their app; landlord
//      owns the property the app targets).
// ============================================================

// The status transition matrix. Key = current status, value = the
// statuses you are ALLOWED to move to from there.
// - LANDLORD/ADMIN can use every transition EXCEPT WITHDRAWN.
// - TENANT can ONLY use WITHDRAWN (and only on their own application).
// - Terminal states (APPROVED/REJECTED/WITHDRAWN) have no outgoing
//   transitions — they are immutable.
const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  SUBMITTED: [
    ApplicationStatus.UNDER_REVIEW,
    ApplicationStatus.APPROVED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  UNDER_REVIEW: [
    ApplicationStatus.APPROVED,
    ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
  ],
  APPROVED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

// ------------------------------------------------------------
// CREATE APPLICATION (tenant only)
// ------------------------------------------------------------
// 1. Property must exist AND be PUBLISHED.
// 2. No active (non-terminal) application may already exist for
//    this tenant + property. This replaces what would have been a
//    DB-level @@unique constraint — and it allows REAPPLYING after
//    a rejection/withdrawal, which a hard unique would block forever.
// 3. Create it.
// ------------------------------------------------------------
export async function createApplicationByTenant(
  tenantId: string,
  propertyId: string,
  note?: string
) {
  // 1. Property must exist and be accepting applications.
  const property = await findPropertyById(propertyId);
  if (!property) throw new Error("Property not found");
  if (property.status !== PropertyStatus.PUBLISHED) {
    throw new Error("This property is not accepting applications");
  }

  // 2. One active application per tenant per property.
  const active = await findActiveApplication(tenantId, propertyId);
  if (active) {
    throw new Error("You already have an active application for this property");
  }

  // 3. Create.
  return createApplication({
    tenantId,
    propertyId,
    // exactOptionalPropertyTypes: only include `note` when it's actually
    // provided (passing `undefined` explicitly is a type error).
    ...(note ? { note } : {}),
  });
}

// ------------------------------------------------------------
// GET MY APPLICATIONS
// ------------------------------------------------------------
// A tenant's own submissions.
// ------------------------------------------------------------
export async function getMyApplicationsByTenant(tenantId: string) {
  return findApplicationsByTenant(tenantId);
}

// ------------------------------------------------------------
// GET APPLICATION BY ID (two-party access control)
// ------------------------------------------------------------
// The applicant OR the property owner/admin may view it.
// ------------------------------------------------------------
export async function getApplicationById(
  id: string,
  userId: string,
  role: string
) {
  const application = await findApplicationById(id);
  if (!application) throw new Error("Application not found");

  const isApplicant = application.tenantId === userId;
  const isOwner = application.property.ownerId === userId;
  const isAdmin = role === Role.ADMIN;

  if (!isApplicant && !isOwner && !isAdmin) {
    throw new Error("You do not have permission to view this application");
  }

  return application;
}

// ------------------------------------------------------------
// CHANGE APPLICATION STATUS (the state machine)
// ------------------------------------------------------------
// - TENANT:    can only WITHDRAW (their own application), and only
//              from SUBMITTED or UNDER_REVIEW.
// - LANDLORD:  can approve/reject/put-under-review applications on
//              their OWN property.
// - ADMIN:     can change status on any application.
// - Terminal states are immutable.
// ------------------------------------------------------------
export async function changeApplicationStatus(
  id: string,
  next: ApplicationStatus,
  actor: { userId: string; role: string }
) {
  const application = await findApplicationById(id);
  if (!application) throw new Error("Application not found");

  const current = application.status;
  const allowed = ALLOWED_TRANSITIONS[current] ?? [];

  // ---- TENANT WITHDRAW ----
  if (next === ApplicationStatus.WITHDRAWN) {
    // Only the applicant themselves may withdraw.
    if (actor.role !== Role.TENANT || application.tenantId !== actor.userId) {
      throw new Error("You do not have permission to withdraw this application");
    }
    if (!allowed.includes(ApplicationStatus.WITHDRAWN)) {
      throw new Error(`Cannot move application from ${current} to ${next}`);
    }
    return updateApplicationStatus(id, next);
  }

  // ---- LANDLORD / ADMIN DECISION ----
  const isOwner = application.property.ownerId === actor.userId;
  const isAdmin = actor.role === Role.ADMIN;
  if (!isOwner && !isAdmin) {
    throw new Error("You do not have permission to change this application");
  }

  if (!allowed.includes(next)) {
    throw new Error(`Cannot move application from ${current} to ${next}`);
  }

  return updateApplicationStatus(id, next);
}