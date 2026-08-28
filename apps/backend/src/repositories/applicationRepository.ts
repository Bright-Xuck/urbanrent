import prisma from "../config/prisma.js";
import { ApplicationStatus } from "../../generated/prisma/enums.js";

// ============================================================
// APPLICATION REPOSITORY
// ============================================================
// Handles all database operations for the Application table.
// CRUD only — no business logic, no authorization checks.
// ============================================================

// The data needed to CREATE an application.
export interface CreateApplicationInput {
  tenantId: string;
  propertyId: string;
  note?: string;
}

// ------------------------------------------------------------
// CREATE APPLICATION
// ------------------------------------------------------------
export async function createApplication(data: CreateApplicationInput) {
  return prisma.application.create({
    data: {
      tenantId: data.tenantId,
      propertyId: data.propertyId,
      note: data.note ?? null,
    },
  });
}

// ------------------------------------------------------------
// FIND APPLICATION BY ID
// ------------------------------------------------------------
// Includes the property (and its owner) so the service layer can
// do the two-party visibility / ownership checks.
// ------------------------------------------------------------
export async function findApplicationById(id: string) {
  return prisma.application.findUnique({
    where: { id },
    include: {
      property: {
        include: { owner: { select: { id: true, email: true } } },
      },
    },
  });
}

// ------------------------------------------------------------
// FIND ACTIVE APPLICATION (non-terminal)
// ------------------------------------------------------------
// Used to enforce "one ACTIVE application per tenant per property".
// "Active" means still in the running: SUBMITTED or UNDER_REVIEW.
// terminal statuses (APPROVED/REJECTED/WITHDRAWN) allow a re-apply.
// ------------------------------------------------------------
export async function findActiveApplication(
  tenantId: string,
  propertyId: string
) {
  return prisma.application.findFirst({
    where: {
      tenantId,
      propertyId,
      status: {
        in: [ApplicationStatus.SUBMITTED, ApplicationStatus.UNDER_REVIEW],
      },
    },
  });
}

// ------------------------------------------------------------
// FIND APPLICATIONS BY TENANT
// ------------------------------------------------------------
export async function findApplicationsByTenant(tenantId: string) {
  return prisma.application.findMany({
    where: { tenantId },
    include: { property: true },
    orderBy: { createdAt: "desc" },
  });
}

// ------------------------------------------------------------
// UPDATE APPLICATION STATUS
// ------------------------------------------------------------
export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus
) {
  return prisma.application.update({
    where: { id },
    data: { status },
  });
}