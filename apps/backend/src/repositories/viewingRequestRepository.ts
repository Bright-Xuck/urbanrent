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