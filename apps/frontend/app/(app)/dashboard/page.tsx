"use client";

// ============================================================
// DASHBOARD — MY LISTINGS
// ============================================================
// GET /api/properties/mine returns the caller's OWN properties in EVERY
// status (drafts and archived included), which is the whole point of this
// page: the public browse endpoint only ever shows PUBLISHED rows.
//
// ownerId comes from the access token on the backend, so there is nothing
// to pass in and no way to request someone else's rows.
//
// Publish / unpublish / archive / delete all live in
// PropertyAdminActions, which reports back here so the row can be replaced
// (or dropped) without a full refetch.
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bath, BedDouble, Building2, MapPin } from "lucide-react";
import { getMyProperties } from "../../../api/propertyApi";
import type { Property } from "../../../api/types";
import { formatXAF } from "../../../lib/format";
import RequireAuth from "../../../components/layout/RequireAuth";
import PageHeader from "../../../components/layout/PageHeader";
import PropertyAdminActions from "../../../components/properties/PropertyAdminActions";
import Alert from "../../../components/ui/Alert";
import Pagination from "../../../components/ui/Pagination";
import StatusBadge from "../../../components/ui/StatusBadge";
import { EmptyState, Loading } from "../../../components/ui/States";

const PAGE_SIZE = 10;

export default function DashboardPage() {
  return (
    <RequireAuth roles={["LANDLORD", "ADMIN"]} title="Your listings">
      <MyListings />
    </RequireAuth>
  );
}

function MyListings() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Bumped after a delete to pull the page fresh (a removed row can leave
  // the last page empty, which the refetch sorts out honestly).
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getMyProperties({ offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE })
      .then((data) => {
        if (!active) return;
        setProperties(data.properties);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Could not load your properties"
        );
        setProperties([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, reloadKey]);

  function handleChanged(updated: Property) {
    setProperties((current) =>
      current.map((property) => (property.id === updated.id ? updated : property))
    );
  }

  function handleDeleted(id: string) {
    setProperties((current) => current.filter((property) => property.id !== id));
    setTotal((current) => Math.max(current - 1, 0));
    setReloadKey((current) => current + 1);
  }

  return (
    <div>
      <PageHeader
        title="My listings"
        subtitle={
          total > 0
            ? `${total} listing${total === 1 ? "" : "s"}, drafts included`
            : "Everything you own — drafts, published, archived."
        }
      />

      {error && (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {loading && (
        <div className="mt-6">
          <Loading text="Loading your listings…" />
        </div>
      )}

      {!loading && !error && properties.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={Building2}
            title="No listings yet"
            description="Create your first listing — you can save it as a draft and publish when you're ready."
            link={{ label: "Add a listing", href: "/dashboard/properties/new" }}
          />
        </div>
      )}

      {!loading && properties.length > 0 && (
        <div className="mt-8">
          {/* A management list rather than cards: each row needs its title,
              status and four actions to stay legible. */}
          <div className="record-list">
            {properties.map((property) => (
              <div key={property.id} className="record">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link href={`/property/${property.id}`} className="record-title">
                      {property.title}
                    </Link>

                    <div className="record-meta">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" aria-hidden />
                        {property.neighborhood ? `${property.neighborhood}, ` : ""}
                        {property.city}
                      </span>
                      <span>{formatXAF(property.monthlyRent)} / month</span>
                      <span className="inline-flex items-center gap-1.5">
                        <BedDouble className="h-3.5 w-3.5" aria-hidden />
                        {property.bedrooms ?? 0} Beds
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Bath className="h-3.5 w-3.5" aria-hidden />
                        {property.bathrooms ?? 0} Baths
                      </span>
                    </div>
                  </div>

                  <StatusBadge status={property.status} />
                </div>

                <div className="record-actions">
                  <PropertyAdminActions
                    property={property}
                    onChanged={handleChanged}
                    onDeleted={handleDeleted}
                  />
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPrevious={() => setPage((current) => current - 1)}
            onNext={() => setPage((current) => current + 1)}
          />
        </div>
      )}
    </div>
  );
}
