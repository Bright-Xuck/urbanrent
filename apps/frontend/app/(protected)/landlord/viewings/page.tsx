"use client";

// ============================================================
// LANDLORD INBOX — VIEWING REQUESTS — /dashboard/viewings
// ============================================================
// RequireAuth is the wall: IncomingViewings only mounts for a landlord/
// admin, so its load effect only ever runs with a valid session behind it.

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { getIncomingViewingRequests } from "../../../../api/viewingRequestApi";
import type { ViewingRequest } from "../../../../api/types";
import { formatDateTime, formatTimes } from "../../../../lib/format";
import RequireAuth from "../../../../components/layout/RequireAuth";
import PageHeader from "../../../../components/layout/PageHeader";
import Alert from "../../../../components/ui/Alert";
import StatusBadge from "../../../../components/ui/StatusBadge";
import { EmptyState, Loading } from "../../../../components/ui/States";

export default function IncomingViewingsPage() {
  return (
    <RequireAuth roles={["LANDLORD", "ADMIN"]} title="Viewing requests on your listings">
      <IncomingViewings />
    </RequireAuth>
  );
}

function IncomingViewings() {
  const [requests, setRequests] = useState<ViewingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await getIncomingViewingRequests();
        if (active) setRequests(data);
      } catch (err: unknown) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Could not load viewing requests"
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Viewing requests"
        subtitle="People who asked to view your listings, newest first."
      />

      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {loading && (
        <div className="mt-6">
          <Loading text="Loading viewing requests…" />
        </div>
      )}

      {!loading && !error && requests.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={CalendarDays}
            title="No viewing requests yet"
            description="When a tenant proposes times to view one of your published listings, they show up here."
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

              <div className="record-meta">
                <span>Requested by {request.tenant?.email ?? request.tenantId}</span>
                {request.property && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {request.property.neighborhood
                      ? `${request.property.neighborhood}, `
                      : ""}
                    {request.property.city}
                  </span>
                )}
              </div>

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