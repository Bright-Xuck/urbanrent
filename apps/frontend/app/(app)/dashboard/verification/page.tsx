"use client";

// ============================================================
// VERIFICATION — /dashboard/verification (LANDLORD)
// ============================================================
// Why this page exists, in one sentence: no approved document means no
// published listings, so this is the single most important action a new
// landlord takes.
//
// Upload National ID or proof of ownership (image or PDF, 10MB max), then
// watch the admin's decision land on each document. A rejection carries
// the admin's note, so a landlord always knows WHAT to fix — never a
// silent "rejected". Once any document is APPROVED, publishing unlocks.
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, UploadCloud } from "lucide-react";
import {
  getMyVerificationDocuments,
  uploadVerificationDocument,
} from "../../../../api/verificationApi";
import type {
  VerificationDocument,
  VerificationDocumentType,
  VerificationState,
} from "../../../../api/types";
import RequireAuth from "../../../../components/layout/RequireAuth";
import PageHeader from "../../../../components/layout/PageHeader";
import Alert from "../../../../components/ui/Alert";
import Button from "../../../../components/ui/Button";
import { Input, Select } from "../../../../components/ui/Fields";
import StatusBadge from "../../../../components/ui/StatusBadge";
import { EmptyState, Loading } from "../../../../components/ui/States";

export default function VerificationPage() {
  return (
    <RequireAuth roles={["LANDLORD", "ADMIN"]} title="Verification">
      <Verification />
    </RequireAuth>
  );
}

const DOCUMENT_LABELS: Record<VerificationDocumentType, string> = {
  NATIONAL_ID: "National ID",
  PROOF_OF_OWNERSHIP: "Proof of ownership",
};

function Verification() {
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [state, setState] = useState<VerificationState>("UNVERIFIED");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] =
    useState<VerificationDocumentType>("NATIONAL_ID");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const data = await getMyVerificationDocuments();
        if (!active) return;
        setDocuments(data.documents);
        setState(data.verificationState);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Could not load your documents"
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    if (!file || uploading) return;

    setUploading(true);
    setUploadError(null);

    try {
      const created = await uploadVerificationDocument(file, documentType);
      setDocuments((current) => [created, ...current]);
      setFile(null);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Could not upload the document"
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Verification"
        subtitle="Get verified to publish listings — tenants look for the badge."
      />

      <div className="mt-6">
        {state === "VERIFIED" ? (
          <Alert variant="success">
            You are verified. Your listings can be published, and tenants see
            the Verified badge on them.
          </Alert>
        ) : (
          <Alert variant="warning">
            You are not verified yet. You can save listings as drafts, but
            publishing is blocked until an admin approves one of your
            documents below.
          </Alert>
        )}
      </div>

      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {loading ? (
        <div className="mt-6">
          <Loading text="Loading your documents..." />
        </div>
      ) : (
        <>
          <form onSubmit={handleUpload} className="panel mt-6 p-5">
            <h3 className="flex items-center gap-2 font-semibold">
              <UploadCloud className="h-4 w-4" aria-hidden />
              Upload a document
            </h3>
            <p className="mt-1 text-sm text-ink-soft">
              National ID or proof of ownership — image or PDF, up to 10MB.
              Only you and the admins can ever see it.
            </p>

            <div className="mt-4 flex flex-wrap items-end gap-4">
              <Select
                label="Document type"
                className="w-56"
                value={documentType}
                onChange={(event) =>
                  setDocumentType(event.target.value as VerificationDocumentType)
                }
              >
                <option value="NATIONAL_ID">National ID</option>
                <option value="PROOF_OF_OWNERSHIP">Proof of ownership</option>
              </Select>

              <Input
                label="File"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(event) =>
                  setFile(event.target.files?.[0] ?? null)
                }
              />

              <Button
                variant="primary"
                type="submit"
                disabled={!file || uploading}
              >
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>

            {uploadError && (
              <div className="mt-4">
                <Alert variant="error">{uploadError}</Alert>
              </div>
            )}
          </form>

          <div className="mt-6">
            {documents.length === 0 ? (
              <EmptyState
                icon={BadgeCheck}
                title="No documents yet"
                description="Upload your first document above to start verification."
              />
            ) : (
              <div className="panel divide-y overflow-x-auto">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-wrap items-center gap-3 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {DOCUMENT_LABELS[document.documentType]}
                      </p>
                      <p className="text-sm text-ink-soft">
                        {new Date(document.createdAt).toLocaleDateString()}
                      </p>
                      {document.status === "REJECTED" && document.reviewNote && (
                        <p className="mt-1 text-sm">
                          Admin note: {document.reviewNote}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={document.status} />
                    {document.viewUrl && (
                      <Link
                        href={document.viewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-navy underline"
                      >
                        View
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
