import prisma from "../config/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";
import { ViewingRequestStatus } from "../../generated/prisma/enums.js";

// ============================================================
// VIEWING REQUEST REPOSITORY
// ============================================================
// Handles all database operations for the ViewingRequest table.
// CRUD only — no business logic, no authorization checks.
// ============================================================

// The proposedTimes column is a JSON array of suggested datetimes.
// At the repository layer it's just a JSON value we pass through.
export interface CreateViewingRequestInput {
  propertyId: string;
  tenantId: string;
  proposedTimes: string[]; // array of ISO datetime strings
}

// ------------------------------------------------------------
// CREATE VIEWING REQUEST
// ------------------------------------------------------------
export async function createViewingRequest(data: CreateViewingRequestInput) {
  return prisma.viewingRequest.create({
    data: {
      propertyId: data.propertyId,
      tenantId: data.tenantId,
      proposedTimes: data.proposedTimes as unknown as Prisma.InputJsonValue,
    },
  });
}

// ------------------------------------------------------------
// FIND VIEWING REQUEST BY ID
// ------------------------------------------------------------
// Includes the property (and its owner) so the service layer can do
// the two-party visibility / ownership checks.
// ------------------------------------------------------------
export async function findViewingRequestById(id: string) {
  return prisma.viewingRequest.findUnique({
    where: { id },
    include: {
      property: {
        include: { owner: { select: { id: true, email: true } } },
      },
    },
  });
}

// ------------------------------------------------------------
// FIND VIEWING REQUESTS BY TENANT
// ------------------------------------------------------------
export async function findViewingRequestsByTenant(tenantId: string) {
  return prisma.viewingRequest.findMany({
    where: { tenantId },
    include: { property: true },
    orderBy: { createdAt: "desc" },
  });
}

// ------------------------------------------------------------
// UPDATE VIEWING REQUEST STATUS
// ------------------------------------------------------------
// Also lets us set confirmedTime when a request becomes CONFIRMED.
// ------------------------------------------------------------
export async function updateViewingRequestStatus(
  id: string,
  status: ViewingRequestStatus,
  confirmedTime?: Date
) {
  return prisma.viewingRequest.update({
    where: { id },
    data: {
      status,
      // exactOptionalPropertyTypes: only set confirmedTime when provided.
      ...(confirmedTime ? { confirmedTime } : {}),
    },
  });
}

// ------------------------------------------------------------
// CONFIRM A VIEWING — WITHOUT DOUBLE-BOOKING THE LANDLORD
// ------------------------------------------------------------
// This is the ONE transactional function in the app. Everything inside
// prisma.$transaction runs as a single all-or-nothing unit:
//
//   1. LOCK the landlord's "users" row (raw SQL: SELECT ... FOR UPDATE,
//      because Prisma has no built-in FOR UPDATE). If another confirm
//      for the SAME landlord is running right now, this line WAITS
//      until that one finishes. This is what kills the race.
//   2. RE-READ the request inside the transaction — the status check
//      the service did earlier is stale by now.
//   3. READ the landlord's other CONFIRMED viewings (ALL their
//      properties — the landlord is the one who has to show up).
//   4. CHECK: any confirmed viewing within conflictWindowMs of the new
//      time? → throw → the whole transaction rolls back automatically
//      (the controller maps the word "overlap" to 409 Conflict).
//   5. WRITE the confirm. Returning from the callback = auto-COMMIT.
//      Throwing = auto-ROLLBACK. We never type BEGIN/COMMIT ourselves.
//
// Important: every query inside the block uses `tx` (the transaction
// client). Using the global `prisma` here would run OUTSIDE the
// transaction and the lock/check would be useless.
// ------------------------------------------------------------
export async function confirmViewingWithoutConflicts(
  ownerId: string,
  requestId: string,
  confirmedTime: Date,
  conflictWindowMs: number
) {
  return prisma.$transaction(async (tx) => {
    // 1. Pessimistic lock on the landlord's row.
    const locked = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "users" WHERE id = ${ownerId} FOR UPDATE
    `;
    if (locked.length === 0) {
      throw new Error("Property owner not found");
    }

    // 2. Re-read inside the transaction — is it still REQUESTED?
    const request = await tx.viewingRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) {
      throw new Error("Viewing request not found");
    }
    if (request.status !== ViewingRequestStatus.REQUESTED) {
      throw new Error(
        `Cannot move viewing request from ${request.status} to ${ViewingRequestStatus.CONFIRMED}`
      );
    }

    // 3. The landlord's OTHER confirmed viewings, across ALL their properties.
    const others = await tx.viewingRequest.findMany({
      where: {
        status: ViewingRequestStatus.CONFIRMED,
        id: { not: requestId },
        property: { ownerId },
      },
      select: { id: true, confirmedTime: true },
    });

    // 4. Overlap check — block anything within the window.
    for (const other of others) {
      if (
        other.confirmedTime &&
        Math.abs(other.confirmedTime.getTime() - confirmedTime.getTime()) < conflictWindowMs
      ) {
        throw new Error("This confirmed time overlaps another confirmed viewing");
      }
    }

    // 5. Clear — confirm. Commits when this callback returns.
    return tx.viewingRequest.update({
      where: { id: requestId },
      data: { status: ViewingRequestStatus.CONFIRMED, confirmedTime },
    });
  });
}