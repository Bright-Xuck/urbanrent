import prisma from "../config/prisma.js";
import type { VerificationDocumentStatus, VerificationDocumentType } from "../../generated/prisma/enums.js";

export interface CreateVerificationDocumentInput {
  userId: string;
  storagePath: string;
  documentType: VerificationDocumentType;
}

export async function createVerificationDocument(data: CreateVerificationDocumentInput) {
  return prisma.verificationDocument.create({
    data: {
      userId: data.userId,
      url: null,
      storagePath: data.storagePath,
      documentType: data.documentType,
    },
  });
}

export async function findDocumentsByUser(userId: string) {
  return prisma.verificationDocument.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function findPendingDocuments(offset: number, limit: number) {
  const where = { status: "PENDING" as const };

  const [documents, total] = await Promise.all([
    prisma.verificationDocument.findMany({
      where,
      include: { user: { select: { id: true, email: true } } },
      orderBy: { createdAt: "asc" },
      skip: offset,
      take: limit,
    }),
    prisma.verificationDocument.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);
  return { documents, total, offset, limit, totalPages };
}

export async function findVerificationDocumentById(id: string) {
  return prisma.verificationDocument.findUnique({
    where: { id },
  });
}

// Approve a document AND mark the user verified, in one transaction.
// A throw anywhere inside rolls both writes back.
export async function approveDocumentAndVerifyUser(documentId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const document = await tx.verificationDocument.update({
      where: { id: documentId },
      data: { status: "APPROVED" as VerificationDocumentStatus },
    });

    await tx.user.update({
      where: { id: userId },
      data: { verificationState: "VERIFIED" },
    });

    return document;
  });
}

export async function rejectVerificationDocument(documentId: string, reviewNote: string | null) {
  const data: { status: VerificationDocumentStatus; reviewNote?: string | null } = {
    status: "REJECTED" as VerificationDocumentStatus,
  };
  if (reviewNote) data.reviewNote = reviewNote;

  return prisma.verificationDocument.update({
    where: { id: documentId },
    data,
  });
}
