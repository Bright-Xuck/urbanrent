"use client";

// ============================================================
// ADMIN — LISTING MODERATION (/admin/moderation)
// ============================================================
// Two independent admin actions live on one row:
//
//   1. REVIEW the report — Mark reviewed / Dismiss (flips the report's
//      own status; a report can be dismissed as unfounded).
//   2. MODERATE the listing — Unpublish / Archive (soft states, so
//      nothing is destroyed). Reviewing does NOT take anything down,
//      and taking down does NOT require reviewing first.
//
// Each row links out to the public listing page so the admin can look
// at the listing itself in context before deciding.
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flag } from "lucide-react";
import {
  getReports,
  moderateProperty,
  reviewReport,
  type ModerationAction,
  type ReviewDecision,
} from "../../../api/reportApi";
import type {
  PropertyReport,
  PropertyReportReason,
  PropertyReportStatus,
} from "../../../api/types";
import PageHeader from "../../../components/layout/PageHeader";
import Alert from "../../../components/ui/Alert";
import Button from "../../../components/ui/Button";
import { Select } from "../../../components/ui/Fields";
import Pagination from "../../../components/ui/Pagination";
import StatusBadge from "../../../components/ui/StatusBadge";
import { EmptyState, Loading } from "../../../components/ui/States";

const PAGE_SIZE = 10;

const REASON_LABELS: Record<PropertyReportReason, string> = {
  SCAM_OR_FRAUD: "Scam or fraud",
  MISLEADING_INFORMATION: "Misleading information",
  ALREADY_RENTED: "Already rented",
  OTHER: "Other",
};

type ActionKind = ReviewDecision | ModerationAction;

function confirmCopy(kind: ActionKind): string {
  switch (kind) {
    case "REVIEWED":
      return "Mark this report reviewed?";
    case "DISMISSED":
      return "Dismiss this report as unfounded?";
    case "UNPUBLISHED":
      return "Unpublish the listing? It leaves the marketplace until the landlord republishes.";
    case "ARCHIVED":
      return "Archive the listing? It leaves the marketplace for good (soft state).";
  }
}

export default function ModerationPage() {
  return <ModerationQueue />;
}

function ModerationQueue() {
  const [reports, setReports] = useState<PropertyReport[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<PropertyReportStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Two-step confirm state: which row is asking, and for what.
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [decisionKind, setDecisionKind] = useState<ActionKind>("REVIEWED");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const data = await getReports(
          statusFilter || undefined,
          (page - 1) * PAGE_SIZE,
          PAGE_SIZE
        );
        if (!active) return;
        setReports(data.reports);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Could not load the reports"
        );
        setReports([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [page, statusFilter, reloadKey]);

  function startDecision(reportId: string, kind: ActionKind) {
    setDecidingId(reportId);
    setDecisionKind(kind);
    setActionError(null);
  }

  async function submitDecision(report: PropertyReport) {
    setBusy(true);
    setActionError(null);

    try {
      if (decisionKind === "REVIEWED" || decisionKind === "DISMISSED") {
        await reviewReport(report.id, decisionKind);
      } else {
        await moderateProperty(report.propertyId, decisionKind);
      }
      setDecidingId(null);
      setReloadKey((current) => current + 1);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not complete that action"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Listing moderation"
        subtitle={
          total > 0
            ? `${total} report${total === 1 ? "" : "s"} on file`
            : "Tenant reports about listings."
        }
      />

      <div className="mt-6">
        <Select
          label="Report status"
          className="w-44"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as PropertyReportStatus | "");
            setPage(1);
          }}
        >
          <option value="">All</option>
          <option value="OPEN">Open</option>
          <option value="REVIEWED">Reviewed</option>
          <option value="DISMISSED">Dismissed</option>
        </Select>
      </div>

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
          <Loading text="Loading reports..." />
        </div>
      ) : !error && reports.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Flag}
            title="Nothing here"
            description="No reports match this filter right now."
          />
        </div>
      ) : (
        !error && (
          <>
            <div className="panel mt-6 divide-y overflow-x-auto">
              {reports.map((report) => (
                <div key={report.id} className="p-4">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                    <div>
                      <p className="font-medium">
                        {REASON_LABELS[report.reason]}
                      </p>
                      <p className="text-sm text-ink-soft">
                        reported by {report.reporter?.email ?? report.reporterId}
                      </p>
                    </div>
                    <p className="text-sm text-ink-soft">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                    <StatusBadge status={report.status} />
                  </div>

                  {report.property && (
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span>
                        Listing: {report.property.title} ({report.property.city})
                      </span>
                      <StatusBadge status={report.property.status} />
                      <Link
                        href={`/property/${report.property.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-navy underline"
                      >
                        View listing
                      </Link>
                    </div>
                  )}

                  <div className="mt-3">
                    {decidingId === report.id ? (
                      <span className="inline-flex flex-wrap items-center gap-2 text-sm">
                        <span>{confirmCopy(decisionKind)}</span>
                        <Button
                          variant={
                            decisionKind === "DISMISSED" ||
                            decisionKind === "UNPUBLISHED" ||
                            decisionKind === "ARCHIVED"
                              ? "danger-outline"
                              : "success"
                          }
                          className="btn-sm"
                          disabled={busy}
                          onClick={() => submitDecision(report)}
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
                    ) : (
                      <span className="inline-flex flex-wrap gap-2">
                        {report.status === "OPEN" && (
                          <>
                            <Button
                              variant="success"
                              className="btn-sm"
                              onClick={() => startDecision(report.id, "REVIEWED")}
                            >
                              Mark reviewed
                            </Button>
                            <Button
                              variant="outline"
                              className="btn-sm"
                              onClick={() => startDecision(report.id, "DISMISSED")}
                            >
                              Dismiss
                            </Button>
                          </>
                        )}
                        {report.property &&
                          report.property.status === "PUBLISHED" && (
                            <>
                              <Button
                                variant="outline"
                                className="btn-sm"
                                onClick={() =>
                                  startDecision(report.id, "UNPUBLISHED")
                                }
                              >
                                Unpublish
                              </Button>
                              <Button
                                variant="danger-outline"
                                className="btn-sm"
                                onClick={() =>
                                  startDecision(report.id, "ARCHIVED")
                                }
                              >
                                Archive
                              </Button>
                            </>
                          )}
                      </span>
                    )}
                  </div>
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
