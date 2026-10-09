"use client";

// ============================================================
// ADMIN — VERIFICATION QUEUE (/admin/verification)
// ============================================================
// Pending landlord ID/proof documents, oldest first, paginated. Each row
// opens the file through its signed read link (the bucket is private, so
// nothing here is a permanent public URL), then the admin approves or
// rejects.
//
// Approve = document APPROVED + landlord VERIFIED (one backend
// transaction). Reject takes the admin's reason — it lands on the
// document immediately, and the landlord reads it on their own page.
// A decided document leaves the queue on refetch (PENDING-only filter).
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileCheck2 } from "lucide-react";
import {
  getPendingDocuments,
  reviewVerificationDocument,
  type ReviewDecision,
} from "../../../../api/verificationApi";
import type {
  VerificationDocument,
  VerificationDocumentType,
} from "../../../../api/types";
import RequireAuth from "../../../../components/layout/RequireAuth";
import PageHeader from "../../../../components/layout/PageHeader";
import Alert from "../../../../components/ui/Alert";
import Button from "../../../../components/ui/Button";
import { Textarea } from "../../../../components/ui/Fields";
import Pagination from "../../../../components/ui/Pagination";
import { EmptyState, Loading } from "../../../../components/ui/States";

const PAGE_SIZE = 10;

const DOCUMENT_LABELS: Record<VerificationDocumentType, string> = {
  NATIONAL_ID: "National ID",
  PROOF_OF_OWNERSHIP: "Proof of ownership",
};

export default function VerificationQueuePage() {
  return (
    <RequireAuth roles={["ADMIN"]} title="Verification queue">
      <ReviewQueue />
    </RequireAuth>
  );
}

function ReviewQueue() {
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Which document is awaiting a decision, what kind, and the note.
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [decisionKind, setDecisionKind] = useState<ReviewDecision>("APPROVE");
  const [reviewNote, setReviewNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const data = await getPendingDocuments(
          (page - 1) * PAGE_SIZE,
          PAGE_SIZE
        );
        if (!active) return;
        setDocuments(data.documents);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Could not load the queue"
        );
        setDocuments([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [page, reloadKey]);

  function startDecision(documentId: string, decision: ReviewDecision) {
    setDecidingId(documentId);
    setDecisionKind(decision);
    setReviewNote("");
    setActionError(null);
  }

  async function submitDecision(documentId: string) {
    setBusy(true);
    setActionError(null);

    try {
      await reviewVerificationDocument(
        documentId,
        decisionKind,
        reviewNote.trim() ? reviewNote.trim() : undefined
      );
      setDecidingId(null);
      setReviewNote("");
      setReloadKey((current) => current + 1);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not review the document"
      );
    } finally {
      setBusy(false);
    }
  }

  function renderActions(document: VerificationDocument) {
    if (decidingId === document.id) {
      return (
        <div className="flex flex-col gap-2">
          {decisionKind === "REJECT" && (
            <Textarea
              label="Reason (the landlord reads this)"
              value={reviewNote}
              onChange={(event) => setReviewNote(event.target.value)}
              placeholder="e.g. photo too blurry to read the ID number"
            />
          )}
          <span className="inline-flex flex-wrap items-center gap-2 text-sm">
            <span>
              {decisionKind === "APPROVE"
                ? "Approve? The landlord becomes verified."
                : "Reject this document?"}
            </span>
            <Button
              variant={decisionKind === "APPROVE" ? "success" : "danger-outline"}
              className="btn-sm"
              disabled={busy}
              onClick={() => submitDecision(document.id)}
            >
              {busy ? "Working..." : "Yes, confirm"}
            </Button>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => setDecidingId(null)}
            >
              Cancel
            </Button>
          </span>
        </div>
      );
    }

    return (
      <span className="inline-flex flex-wrap gap-2">
        <Button
          variant="success"
          className="btn-sm"
          onClick={() => startDecision(document.id, "APPROVE")}
        >
          Approve
        </Button>
        <Button
          variant="danger-outline"
          className="btn-sm"
          onClick={() => startDecision(document.id, "REJECT")}
        >
          Reject
        </Button>
      </span>
    );
  }

  return (
    <div>
      <PageHeader
        title="Verification queue"
        subtitle={
          total > 0
            ? `${total} document${total === 1 ? "" : "s"} waiting for review`
            : "Landlord ID and ownership documents awaiting review."
        }
      />

      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {actionError && (
        <div className="mt-6">
          <Alert variant="error">{actionError}</Alert>
        </div>
      )}

      {loading ? (
        <div className="mt-6">
          <Loading text="Loading the queue..." />
        </div>
      ) : !error && documents.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={FileCheck2}
            title="Queue is clear"
            description="No landlord documents are waiting for review right now."
          />
        </div>
      ) : (
        !error && (
          <>
            <div className="panel mt-6 divide-y overflow-x-auto">
              {documents.map((document) => (
                <div key={document.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                    <div>
                      <p className="font-medium">
                        {DOCUMENT_LABELS[document.documentType]}
                      </p>
                      <p className="text-sm text-ink-soft">
                        {document.user?.email ?? document.userId}
                      </p>
                    </div>
                    <p className="text-sm text-ink-soft">
                      {new Date(document.createdAt).toLocaleDateString()}
                    </p>
                    {document.viewUrl && (
                      <Link
                        href={document.viewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-navy underline"
                      >
                        View document
                      </Link>
                    )}
                  </div>
                  <div className="mt-3">{renderActions(document)}</div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPrevious={() => setPage((current) => current - 1)}
                onNext={() => setPage((current) => current + 1)}
              />
            </div>
          </>
        )
      )}
    </div>
  );
}
