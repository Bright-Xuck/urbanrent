"use client";

// ============================================================
// LANDLORD INBOX — APPLICATIONS — /dashboard/applications
// ============================================================
// GET /api/applications/incoming returns every application submitted to
// ANY property the caller owns, with the applicant included.
//
// LANDLORD/ADMIN only: the page is gated here with <RequireAuth roles>,
// and the backend backs it up with requireLandordadmin + an ownerId
// scope on every row, so a tenant can neither see this page nor call
// the endpoint. This is the landlord side of applications — tenants
// track their own submissions at /applications.
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, MapPin } from "lucide-react";
import { getIncomingApplications } from "../../../../api/applicationApi";
import type { Application } from "../../../../api/types";
import { formatDate, formatXAF, titleCase } from "../../../../lib/format";
import RequireAuth from "../../../../components/layout/RequireAuth";
import PageHeader from "../../../../components/layout/PageHeader";
import Alert from "../../../../components/ui/Alert";
import StatusBadge from "../../../../components/ui/StatusBadge";
import { EmptyState, Loading } from "../../../../components/ui/States";

export default function IncomingApplicationsPage() {
  return (
    <RequireAuth roles={["LANDLORD", "ADMIN"]} title="Applications on your listings">
      <IncomingApplications />
    </RequireAuth>
  );
}

function IncomingApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getIncomingApplications()
      .then((data) => {
        if (active) setApplications(data);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Could not load incoming applications"
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
    <div>
      <PageHeader
        title="Applications"
        subtitle="People who applied to your listings, newest first."
      />

      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {loading && (
        <div className="mt-6">
          <Loading text="Loading applications…" />
        </div>
      )}

      {!loading && !error && applications.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={FileText}
            title="No applications yet"
            description="When someone applies to one of your published listings, they show up here."
          />
        </div>
      )}

      {!loading && applications.length > 0 && (
        <div className="record-list mt-8">
          {applications.map((application) => (
            <Link
              key={application.id}
              href={`/applications/${application.id}`}
              className="record block"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <h2 className="record-title">
                  {application.property?.title ?? "Listing unavailable"}
                </h2>
                <StatusBadge status={application.status} />
              </div>

              <div className="record-meta">
                <span>Applicant: {application.tenant?.email ?? application.tenantId}</span>
                {application.property && (
                  <>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      {application.property.neighborhood
                        ? `${application.property.neighborhood}, `
                        : ""}
                      {application.property.city}
                    </span>
                    <span>
                      {formatXAF(application.property.monthlyRent)} / month
                    </span>
                    <span>{titleCase(application.property.propertyType)}</span>
                  </>
                )}
              </div>

              {application.note && <p className="record-note">“{application.note}”</p>}

              <p className="record-meta">
                Submitted {formatDate(application.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
