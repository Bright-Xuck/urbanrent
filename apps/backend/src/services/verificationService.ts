import supabase from "../config/supabase.js";
import { randomUUID } from "node:crypto";
import { findUserById } from "../repositories/userRepository.js";
import {
  approveDocumentAndVerifyUser,
  createVerificationDocument,
  findDocumentsByUser,
  findPendingDocuments,
  findVerificationDocumentById,
  rejectVerificationDocument,
} from "../repositories/verificationRepository.js";
import type { VerificationDocumentType } from "../../generated/prisma/enums.js";

const bucket = process.env.VERIFICATION_BUCKET ?? "verification-documents";

// How long an admin's view link stays valid (seconds).
const SIGNED_URL_TTL = 60 * 60;

// Make sure the private bucket exists before the first upload.
// The service-role key can create buckets, so a fresh environment
// needs no dashboard setup — first upload provisions it.
async function ensureBucket() {
  const { error } = await supabase.storage.getBucket(bucket);
  if (!error) return;

  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: false,
  });
  if (createError) throw new Error(createError.message);
}

// UPLOAD a verification document for yourself.
// LANDLORD-only is enforced by the route (requireLandlord), not here.
export async function uploadVerificationDocument(
  userId: string,
  file: Express.Multer.File,
  documentType: VerificationDocumentType
) {
  await ensureBucket();

  const objectPath = `verification/${userId}/${randomUUID()}`;

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(objectPath, file.buffer, { contentType: file.mimetype });
    if (error) throw new Error(error.message);

    // Private bucket: no public URL to store (`url` stays NULL, signed
    // URLs are generated at read time from `storagePath`).
    return await createVerificationDocument({
      userId,
      storagePath: objectPath,
      documentType,
    });
  } catch (err) {
    // Don't leave an orphaned file behind if the DB write fails.
    await supabase.storage.from(bucket).remove([objectPath]);
    throw err;
  }
}

// Signed read link for ONE document (admin queue view + detail).
export async function signDocumentUrl(storagePath: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(storagePath, SIGNED_URL_TTL);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

// MY DOCUMENTS — the landlord's own uploads (each with a fresh read link).
export async function getMyDocuments(userId: string) {
  const documents = await findDocumentsByUser(userId);

  return Promise.all(
    documents.map(async (document) => ({
      ...document,
      viewUrl: await signDocumentUrl(document.storagePath),
    }))
  );
}

// ADMIN REVIEW QUEUE — pending docs, oldest first, each with a read link.
export async function getPendingDocuments(offset: number, limit: number) {
  const result = await findPendingDocuments(offset, limit);

  const documents = await Promise.all(
    result.documents.map(async (document) => ({
      ...document,
      viewUrl: await signDocumentUrl(document.storagePath),
    }))
  );

  return { ...result, documents };
}

// Require a verified owner before any move TO the published state.
// Read by the property service, never directly by a route.
export async function requireVerifiedOwner(ownerId: string) {
  const owner = await findUserById(ownerId);
  if (!owner) throw new Error("Property owner not found");
  if (owner.verificationState !== "VERIFIED") {
    throw new Error(
      "Only verified landlords can publish listings. Upload a verification document and wait for approval first."
    );
  }
}

export type ReviewDecision = "APPROVE" | "REJECT";

// ADMIN REVIEW of one document. Only PENDING docs can be decided —
// re-deciding an APPROVED/REJECTED doc throws and changes nothing.
export async function reviewDocument(
  documentId: string,
  decision: ReviewDecision,
  reviewNote: string | null
) {
  const document = await findVerificationDocumentById(documentId);
  if (!document) throw new Error("Verification document not found");
  if (document.status !== "PENDING") {
    throw new Error("This document has already been reviewed");
  }

  if (decision === "APPROVE") {
    return approveDocumentAndVerifyUser(documentId, document.userId);
  }

  return rejectVerificationDocument(documentId, reviewNote);
}
