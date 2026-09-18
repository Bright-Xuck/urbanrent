"use client";

// ============================================================
// APPLICATION DETAIL — /applications/[id]
// ============================================================
// GET /api/applications/:id returns the application WITH its property and
// that property's owner, because that is what the two-party visibility rule
// needs: the applicant and the property owner (or an admin) may read it.
//
// The decision controls live in components/applications/ApplicationActions,
// which reads its own helper functions off the same data to decide what to
// show. The transition matrix there mirrors the backend's exactly:
//
//   TENANT    → WITHDRAWN, on their own application
//   LANDLORD  → UNDER_REVIEW / APPROVED / REJECTED, on their own property
//   ADMIN     → any of them
//   terminal  → APPROVED / REJECTED / WITHDRAWN take no further moves
//
// A 403 here is a normal answer (someone else's application) and is shown
// as a message, not as an empty page.
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MapPin } from "lucide-react";
import {
  approveApplication,
  getApplicationById,
  rejectApplication,
  reviewApplication,
  withdrawApplication,
} from "../../../../api/applicationApi";
import type { Application } from "../../../../api/types";
import { useAuthStore } from "../../../../Store/useUserStore";
import { formatDate, formatXAF, titleCase } from "../../../../lib/format";
import RequireAuth from "../../../../components/layout/RequireAuth";
import PageHeader from "../../../../components/layout/PageHeader";
import ApplicationActions, {
  type ApplicationAction,
} from "../../../../components/applications/ApplicationActions";
import Alert from "../../../../components/ui/Alert";
import Card from "../../../../components/ui/Card";
import StatusBadge from "../../../../components/ui/StatusBadge";
import { Loading } from "../../../../components/ui/States";

// One lookup table instead of a switch — each action IS one API call.
const ACTION_CALLS: Record<ApplicationAction, (id: string) => Promise<Application>> = {
  withdraw: withdrawApplication,
  review: reviewApplication,
  approve: approveApplication,
  reject: rejectApplication,
};

export default function ApplicationDetailPage() {
  return (
    <RequireAuth title="This application">
      <ApplicationDetail />
    </RequireAuth>
  );
}

function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);

    getApplicationById(id)
      .then((data) => {
        if (active) setApplication(data);
      })
      .catch((err: unknown) => {
        if (active) {
          setLoadError(
            err instanceof Error ? err.message : "Could not load this application"
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

  async function handleAction(action: ApplicationAction) {
    if (!application) return;

    setBusy(true);
    setActionError(null);
    setActionNotice(null);

    try {
      // The backend answers with the updated row, so the badge flips
      // immediately — no refetch needed.
      //
      // IMPORTANT: that row is BARE. updateApplicationStatus() runs a plain
      // prisma.application.update(), with no `include`, so the response has
      // no `property` — unlike GET /:id, which includes it (and its owner).
      // Merging keeps the listing card that is already on screen instead of
      // blanking it the moment a decision is made.
      const updated = await ACTION_CALLS[action](application.id);
      setApplication((current) => (current ? { ...current, ...updated } : updated));
      setActionNotice(`Application updated to ${updated.status.replace("_", " ").toLowerCase()}.`);
    } catch (err) {
      // 403 (not yours), 400 (illegal transition) and 404 (gone) all land here.
      setActionError(err instanceof Error ? err.message : "Could not update the application");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="rp-container rp-section">
        <Loading text="Loading application…" />
      </div>
    );
  }

  if (!application || loadError) {
    return (
      <div className="rp-container rp-section">
        <PageHeader
          title="Application"
          backHref="/applications"
          backLabel="My applications"
        />
        <div className="mt-6">
          <Alert variant="error">
            {loadError ?? "Could not load this application"}
          </Alert>
        </div>
      </div>
    );
  }

  const property = application.property;

  return (
    <div className="rp-container rp-section">
      <PageHeader
        title="Application"
        subtitle={`Submitted ${formatDate(application.createdAt)}`}
        backHref="/applications"
        backLabel="My applications"
      />

      <div className="mt-6 flex items-center gap-3">
        <StatusBadge status={application.status} />
        <span className="text-sm text-ink-soft">
          Last updated {formatDate(application.updatedAt)}
        </span>
      </div>

      <Card className="mt-6">
        <h2 className="panel-title">{property?.title ?? "Listing unavailable"}</h2>

        {property ? (
          <>
            <p className="mt-1 flex items-center gap-1 text-sm text-ink-soft">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {property.neighborhood ? `${property.neighborhood}, ` : ""}
              {property.city}
            </p>
            <dl className="detail-list mt-5">
              <div>
                <dt>Monthly rent</dt>
                <dd>{formatXAF(property.monthlyRent)}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{titleCase(property.propertyType)}</dd>
              </div>
              {property.owner && (
                <div>
                  <dt>Landlord</dt>
                  <dd>{property.owner.email}</dd>
                </div>
              )}
            </dl>
            <p className="mt-5">
              <Link href={`/property/${property.id}`} className="link">
                Open the listing
              </Link>
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">
            The listing this application was made against is no longer available.
          </p>
        )}
      </Card>

      {application.note && (
        <Card className="mt-6">
          <h2 className="panel-title">Your note</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
            {application.note}
          </p>
        </Card>
      )}

      {actionNotice && (
        <div className="mt-6">
          <Alert variant="success">{actionNotice}</Alert>
        </div>
      )}

      {actionError && (
        <div className="mt-6">
          <Alert variant="error">{actionError}</Alert>
        </div>
      )}

      {user && (
        <ApplicationActions
          application={application}
          userId={user.id}
          role={user.role}
          busy={busy}
          onAction={handleAction}
        />
      )}
    </div>
  );
}
