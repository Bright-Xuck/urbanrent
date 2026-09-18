"use client";

// ============================================================
// VIEWING REQUEST DETAIL — /viewings/[id]
// ============================================================
// GET /api/viewing-requests/:id returns the request with its property and
// that property's owner — the same two-party rule as applications: the
// tenant who asked, and the landlord who owns the place, may read it.
//
// The controls live in components/viewings/ViewingActions, which shows the
// landlord's buttons for the current status and keeps the transition matrix
// in one place. A tenant sees a plain explanation instead, because the
// backend only lets the owner (or an admin) move a viewing.
//
// Confirming can come back as a 409 "…overlaps another confirmed viewing":
// that is the backend refusing to double-book one landlord across all of
// their properties, and the message is shown as-is.
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MapPin } from "lucide-react";
import {
  changeViewingRequestStatus,
  getViewingRequestById,
} from "../../../../api/viewingRequestApi";
import type { ViewingRequest, ViewingRequestStatus } from "../../../../api/types";
import { useAuthStore } from "../../../../Store/useUserStore";
import { formatDate, formatDateTime, formatTimes } from "../../../../lib/format";
import RequireAuth from "../../../../components/layout/RequireAuth";
import PageHeader from "../../../../components/layout/PageHeader";
import ViewingActions, {
  type ViewingAction,
} from "../../../../components/viewings/ViewingActions";
import Alert from "../../../../components/ui/Alert";
import Card from "../../../../components/ui/Card";
import StatusBadge from "../../../../components/ui/StatusBadge";
import { Loading } from "../../../../components/ui/States";

// Each action maps to the status value the backend expects.
const ACTION_STATUS: Record<ViewingAction, ViewingRequestStatus> = {
  confirm: "CONFIRMED",
  decline: "DECLINED",
  complete: "COMPLETED",
  no_show: "NO_SHOW",
};

export default function ViewingDetailPage() {
  return (
    <RequireAuth title="This viewing request">
      <ViewingDetail />
    </RequireAuth>
  );
}

function ViewingDetail() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);

  const [request, setRequest] = useState<ViewingRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);

    getViewingRequestById(id)
      .then((data) => {
        if (active) setRequest(data);
      })
      .catch((err: unknown) => {
        if (active) {
          setLoadError(
            err instanceof Error ? err.message : "Could not load this viewing request"
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  async function handleAction(action: ViewingAction, confirmedTime?: string) {
    if (!request) return;

    setBusy(true);
    setActionError(null);
    setActionNotice(null);

    try {
      // CONFIRMED needs the time in the same request; every other move just
      // sends the status.
      //
      // IMPORTANT: the response is a BARE row. Both writers on the backend
      // (updateViewingRequestStatus and the transactional
      // confirmViewingWithoutConflicts) run a plain update with no `include`,
      // so `property` is missing — unlike GET /:id. Merging keeps the
      // listing and, with it, the owner check that decides whether the
      // landlord's action buttons should still render.
      const updated = await changeViewingRequestStatus(
        request.id,
        ACTION_STATUS[action],
        confirmedTime
      );
      setRequest((current) => (current ? { ...current, ...updated } : updated));
      setActionNotice(
        `Viewing request updated to ${updated.status.replace("_", " ").toLowerCase()}.`
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not update the viewing request");
    } finally {
      setBusy(false);
    }
  }

  // Role-aware back link: tenants go back to their own requests,
  // landlords/admins back to the incoming inbox on their dashboard.
  // Declared before the early returns below so they can use it too.
  const isLandlordView = user?.role === "LANDLORD" || user?.role === "ADMIN";
  const backHref = isLandlordView ? "/dashboard/viewings" : "/viewings";
  const backLabel = isLandlordView ? "Viewing requests" : "My viewings";

  if (loading) {
    return (
      <div className="rp-container rp-section">
        <Loading text="Loading viewing request…" />
      </div>
    );
  }

  if (!request || loadError) {
    return (
      <div className="rp-container rp-section">
        <PageHeader
          title="Viewing request"
          backHref={backHref}
          backLabel={backLabel}
        />
        <div className="mt-6">
          <Alert variant="error">
            {loadError ?? "Could not load this viewing request"}
          </Alert>
        </div>
      </div>
    );
  }

  const proposed = request.proposedTimes ?? [];

  return (
    <div className="rp-container rp-section">
      <PageHeader
        title="Viewing request"
        subtitle={`Requested ${formatDate(request.createdAt)}`}
        backHref={backHref}
        backLabel={backLabel}
      />

      <div className="mt-6 flex items-center gap-3">
        <StatusBadge status={request.status} />
        <span className="text-sm text-ink-soft">
          Last updated {formatDate(request.updatedAt)}
        </span>
      </div>

      <Card className="mt-6">
        <h2 className="panel-title">{request.property?.title ?? "Listing unavailable"}</h2>

        {request.property && (
          <>
            <p className="mt-1 flex items-center gap-1 text-sm text-ink-soft">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {request.property.neighborhood ? `${request.property.neighborhood}, ` : ""}
              {request.property.city}
            </p>
            {request.property.owner && (
              <p className="mt-2 text-sm text-ink-soft">
                Landlord: <span className="text-ink">{request.property.owner.email}</span>
              </p>
            )}
            <p className="mt-4">
              <Link href={`/property/${request.property.id}`} className="link">
                Open the listing
              </Link>
            </p>
          </>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="panel-title">When</h2>

        <div className="mt-3 space-y-3 text-sm">
          <div>
            <p className="text-ink-soft">Times proposed</p>
            {proposed.length > 0 ? (
              <ul className="mt-1 space-y-1">
                {proposed.map((time) => (
                  <li key={time} className="text-ink">
                    {formatDateTime(time)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink">No times proposed</p>
            )}
          </div>

          <div>
            <p className="text-ink-soft">Confirmed</p>
            <p className="text-ink">
              {request.confirmedTime
                ? formatDateTime(request.confirmedTime)
                : "Not confirmed yet"}
            </p>
          </div>

          {proposed.length > 0 && !request.confirmedTime && (
            <p className="text-xs text-ink-soft">In full: {formatTimes(request.proposedTimes)}</p>
          )}
        </div>

        {actionNotice && (
          <div className="mt-5">
            <Alert variant="success">{actionNotice}</Alert>
          </div>
        )}

        {actionError && (
          <div className="mt-5">
            <Alert variant="error">{actionError}</Alert>
          </div>
        )}

        {user && (
          <ViewingActions
            request={request}
            userId={user.id}
            role={user.role}
            busy={busy}
            onAction={handleAction}
          />
        )}
      </Card>
    </div>
  );
}
