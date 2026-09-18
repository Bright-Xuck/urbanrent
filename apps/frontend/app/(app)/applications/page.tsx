"use client";

// ============================================================
// MY APPLICATIONS — /applications
// ============================================================
// GET /api/applications/mine. The repository filters on the tenant from
// the access token, so this is always "the applications I submitted",
// each one with the property it was made against already included.
//
// Applications are a TENANT concern (the backend sets every new account to
// TENANT and gates the create route behind requireTenant), but any
// signed-in user can call this safely — a landlord just gets an empty list.
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, MapPin } from "lucide-react";
import { getMyApplications } from "../../../api/applicationApi";
import type { Application } from "../../../api/types";
import { formatDate, formatXAF, titleCase } from "../../../lib/format";
import RequireAuth from "../../../components/layout/RequireAuth";
import PageHeader from "../../../components/layout/PageHeader";
import Alert from "../../../components/ui/Alert";
import StatusBadge from "../../../components/ui/StatusBadge";
import { EmptyState, Loading } from "../../../components/ui/States";

export default function ApplicationsPage() {
  return (
    <RequireAuth title="Your applications">
      <MyApplications />
    </RequireAuth>
  );
}

function MyApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getMyApplications()
      .then((data) => {
        if (active) setApplications(data);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Could not load your applications"
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
        title="My applications"
        subtitle="Every application you've submitted, newest first."
      />

      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {loading && (
        <div className="mt-6">
          <Loading text="Loading your applications…" />
        </div>
      )}

      {!loading && !error && applications.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={FileText}
            title="No applications yet"
            description="Find a listing you like and apply — you can track every decision from here."
            link={{ label: "Browse properties", href: "/properties" }}
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

              {application.property && (
                <div className="record-meta">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" aria-hidden />
                    {application.property.neighborhood
                      ? `${application.property.neighborhood}, `
                      : ""}
                    {application.property.city}
                  </span>
                  <span>{formatXAF(application.property.monthlyRent)} / month</span>
                  <span>{titleCase(application.property.propertyType)}</span>
                </div>
              )}

              {application.note && <p className="record-note">“{application.note}”</p>}

              <p className="record-meta">
                Submitted {formatDate(application.createdAt)}
                {application.updatedAt !== application.createdAt &&
                  ` · Updated ${formatDate(application.updatedAt)}`}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
