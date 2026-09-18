"use client";

// ============================================================
// MY VIEWINGS — /viewings
// ============================================================
// GET /api/viewing-requests/mine, with the target property included.
//
// This is the tenant half of the viewing model: the times you proposed and
// whatever the landlord decided (confirmed one of them, declined, or — after
// the fact — completed / no-show). Nothing is actionable from here, because
// the backend only lets the property owner drive the status, so the rows
// link through to the detail page to read the whole thing.
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { getMyViewingRequests } from "../../../api/viewingRequestApi";
import type { ViewingRequest } from "../../../api/types";
import { formatDateTime, formatTimes } from "../../../lib/format";
import RequireAuth from "../../../components/layout/RequireAuth";
import PageHeader from "../../../components/layout/PageHeader";
import Alert from "../../../components/ui/Alert";
import StatusBadge from "../../../components/ui/StatusBadge";
import { EmptyState, Loading } from "../../../components/ui/States";

export default function ViewingsPage() {
  return (
    <RequireAuth title="Your viewings">
      <MyViewings />
    </RequireAuth>
  );
}

function MyViewings() {
  const [requests, setRequests] = useState<ViewingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getMyViewingRequests()
      .then((data) => {
        if (active) setRequests(data);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Could not load your viewing requests"
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="rp-container rp-section">
      <PageHeader
        title="My viewings"
        subtitle="The times you proposed, and what the landlord decided."
      />

      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {loading && (
        <div className="mt-6">
          <Loading text="Loading your viewings…" />
        </div>
      )}

      {!loading && !error && requests.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={CalendarDays}
            title="No viewing requests yet"
            description="Open a listing and propose a couple of times — the landlord confirms one."
            link={{ label: "Browse properties", href: "/properties" }}
          />
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div className="record-list mt-8">
          {requests.map((request) => (
            <Link
              key={request.id}
              href={`/viewings/${request.id}`}
              className="record block"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <h2 className="record-title">
                  {request.property?.title ?? "Listing unavailable"}
                </h2>
                <StatusBadge status={request.status} />
              </div>

              {request.property && (
                <div className="record-meta">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {request.property.neighborhood
                      ? `${request.property.neighborhood}, `
                      : ""}
                    {request.property.city}
                  </span>
                </div>
              )}

              <p className="record-note">
                {request.status === "CONFIRMED" && request.confirmedTime ? (
                  <>Confirmed for {formatDateTime(request.confirmedTime)}</>
                ) : (
                  <>Proposed: {formatTimes(request.proposedTimes)}</>
                )}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
