import prisma from "../config/prisma.js";
import type { PropertyReportReason, PropertyReportStatus } from "../../generated/prisma/enums.js";

export interface CreateReportInput {
  reporterId: string;
  propertyId: string;
  reason: PropertyReportReason;
}

export async function createReport(data: CreateReportInput) {
  return prisma.propertyReport.create({ data });
}

export async function findReportById(id: string) {
  return prisma.propertyReport.findUnique({ where: { id } });
}

// The service-layer duplicate rule: one OPEN report per reporter per
// property (a closed one may be reported again later).
export async function findOpenReport(reporterId: string, propertyId: string) {
  return prisma.propertyReport.findFirst({
    where: { reporterId, propertyId, status: "OPEN" },
  });
}

export async function findReportsByProperty(propertyId: string) {
  return prisma.propertyReport.findMany({
    where: { propertyId },
    include: { reporter: { select: { id: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// Admin queue: paginated, optionally filtered by status. Includes the
// reporter (who flagged it) and enough property info to review in context.
export async function findReports(
  status: PropertyReportStatus | undefined,
  offset: number,
  limit: number
) {
  const where = status ? { status } : {};

  const [reports, total] = await Promise.all([
    prisma.propertyReport.findMany({
      where,
      include: {
        reporter: { select: { id: true, email: true } },
        property: { select: { id: true, title: true, city: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.propertyReport.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);
  return { reports, total, offset, limit, totalPages };
}

export async function updateReportStatus(
  id: string,
  status: PropertyReportStatus
) {
  return prisma.propertyReport.update({ where: { id }, data: { status } });
}
