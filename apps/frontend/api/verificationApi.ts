import { useAuthStore } from "../Store/useUserStore";
import type {
  VerificationDocument,
  VerificationDocumentType,
  VerificationState,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function readJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, any>;
  } catch {
    return { message: `Verification service unavailable (${response.status})` };
  }
}

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

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
  const token = useAuthStore.getState().accessToken;

  const formData = new FormData();
  formData.append("document", file);
  formData.append("documentType", documentType);

  const response = await fetch(`${API_URL}/verification/documents`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data.message || "Could not upload the document");
  }

  return data.document;
}

// ------------------------------------------------------------
// MINE — GET /api/verification/documents (own uploads + my state)
// ------------------------------------------------------------
export async function getMyVerificationDocuments(): Promise<MyDocumentsResponse> {
  const response = await fetch(`${API_URL}/verification/documents`, {
    headers: authHeaders(),
  });

  const data = await readJson(response);

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
    `${API_URL}/admin/verification/pending?offset=${offset}&limit=${limit}`,
    { headers: authHeaders() }
  );

  const data = await readJson(response);

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
  const response = await fetch(`${API_URL}/admin/verification/${id}/review`, {
    method: "PATCH",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ decision, reviewNote }),
  });

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data.message || "Could not review the document");
  }

  return data.document;
}
