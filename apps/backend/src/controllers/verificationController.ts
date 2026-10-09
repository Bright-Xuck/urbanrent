import type { Request, Response } from "express";
import type { VerificationDocumentType } from "../../generated/prisma/enums.js";
import { findUserById } from "../repositories/userRepository.js";
import {
  getMyDocuments,
  getPendingDocuments,
  reviewDocument,
  uploadVerificationDocument,
} from "../services/verificationService.js";

const DOCUMENT_TYPES = ["NATIONAL_ID", "PROOF_OF_OWNERSHIP"];

// POST /api/verification/documents
// LANDLORD self-upload (single file field: `document`).
export async function UploadVerificationDocument(req: Request, res: Response) {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const { documentType } = req.body;
  if (!DOCUMENT_TYPES.includes(documentType)) {
    res
      .status(400)
      .json({ message: "documentType must be NATIONAL_ID or PROOF_OF_OWNERSHIP" });
    return;
  }

  // multer (.single('document')) puts the file here; missing file =
  // the request never carried one.
  const file = req.file;
  if (!file) {
    res.status(400).json({ message: "No document was uploaded" });
    return;
  }

  try {
    const document = await uploadVerificationDocument(
      userId,
      file,
      documentType as VerificationDocumentType
    );
    res.status(201).json({
      message: "Document uploaded. An admin will review it soon.",
      document,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/verification/documents — my own uploads (+ fresh view links).
export async function GetMyVerificationDocuments(req: Request, res: Response) {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  try {
    const documents = await getMyDocuments(userId);
    const me = await findUserById(userId);
    res.status(200).json({
      documents,
      verificationState: me?.verificationState ?? "UNVERIFIED",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/admin/verification/pending
export async function GetPendingDocuments(req: Request, res: Response) {
  const offset = Number(req.query.offset) || 0;
  const limit = Number(req.query.limit) || 10;
  if (offset < 0 || limit < 1) {
    res.status(400).json({ message: "offset must be >= 0 and limit must be >= 1" });
    return;
  }

  try {
    const result = await getPendingDocuments(offset, limit);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

// PATCH /api/admin/verification/:documentId/review
// Body: { decision: "APPROVE" | "REJECT", reviewNote?: string }
export async function ReviewVerificationDocument(req: Request, res: Response) {
  const { documentId } = req.params;
  if (typeof documentId !== "string") {
    res.status(400).json({ message: "Invalid document id" });
    return;
  }

  const { decision, reviewNote } = req.body;
  if (decision !== "APPROVE" && decision !== "REJECT") {
    res.status(400).json({ message: 'decision must be "APPROVE" or "REJECT"' });
    return;
  }

  try {
    const document = await reviewDocument(
      documentId,
      decision,
      typeof reviewNote === "string" ? reviewNote : null
    );
    res.status(200).json({
      message:
        decision === "APPROVE"
          ? "Document approved. The landlord is now verified."
          : "Document rejected.",
      document,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Verification document not found") {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error instanceof Error && error.message.includes("already been reviewed")) {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
}
