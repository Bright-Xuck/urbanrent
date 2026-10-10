import { apiFetch as fetch } from "../lib/api-client";
import { readApiJson } from "../lib/api-response";
import type {
  VerificationDocument,
  VerificationDocumentType,
  VerificationState,
} from "./types";

export type MyDocumentsResponse = {
  documents: VerificationDocument[];
  verificationState: VerificationState;
};

export type PendingDocumentsResponse = {
  documents: VerificationDocument[];
  total: number;
  offset: number;
  limit: number;
  totalPages: number;
};

export type ReviewDecision = "APPROVE" | "REJECT";

// ------------------------------------------------------------
// UPLOAD — POST /api/verification/documents (LANDLORD self-upload)
// ------------------------------------------------------------
// FormData like the image upload: the browser sets the boundary, and we
// must NOT set a Content-Type header ourselves.
export async function uploadVerificationDocument(
  file: File,
  documentType: VerificationDocumentType
): Promise<VerificationDocument> {
  const formData = new FormData();
  formData.append("document", file);
  formData.append("documentType", documentType);

  const response = await fetch(`/verification/documents`, {
    method: "POST",
    body: formData,
  });

  const data = await readApiJson<{ document: VerificationDocument }>(
    response,
    "Verification service"
  );

  if (!response.ok) {
    throw new Error(data.message || "Could not upload the document");
  }

  return data.document;
}

// ------------------------------------------------------------
// MINE — GET /api/verification/documents (own uploads + my state)
// ------------------------------------------------------------
export async function getMyVerificationDocuments(): Promise<MyDocumentsResponse> {
  const response = await fetch(`/verification/documents`);

  const data = await readApiJson<MyDocumentsResponse>(
    response,
    "Verification service"
  );

  if (!response.ok) {
    throw new Error(data.message || "Could not load your documents");
  }

  return data;
}

// ------------------------------------------------------------
// ADMIN QUEUE — GET /api/admin/verification/pending
// ------------------------------------------------------------
export async function getPendingDocuments(
  offset = 0,
  limit = 10
): Promise<PendingDocumentsResponse> {
  const response = await fetch(
    `/admin/verification/pending?offset=${offset}&limit=${limit}`
  );

  const data = await readApiJson<PendingDocumentsResponse>(
    response,
    "Verification service"
  );

  if (!response.ok) {
    throw new Error(data.message || "Could not load the review queue");
  }

  return data;
}

// ------------------------------------------------------------
// ADMIN REVIEW — PATCH /api/admin/verification/:id/review
// ------------------------------------------------------------
export async function reviewVerificationDocument(
  id: string,
  decision: ReviewDecision,
  reviewNote?: string
): Promise<VerificationDocument> {
  const response = await fetch(`/admin/verification/${id}/review`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, reviewNote }),
  });

  const data = await readApiJson<{ document: VerificationDocument }>(
    response,
    "Verification service"
  );

  if (!response.ok) {
    throw new Error(data.message || "Could not review the document");
  }

  return data.document;
}
