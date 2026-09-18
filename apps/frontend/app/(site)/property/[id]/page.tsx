"use client";

// ============================================================
// LISTING DETAIL — /property/[id]
// ============================================================
// One listing in full: photos, facts, amenities, then — depending on who is
// looking — either the owner's controls or the tenant's apply /
// request-a-viewing panels.
//
// WHY THIS PAGE IS BEHIND <RequireAuth>:
// every property route on the backend runs `authenticate`, including
// GET /api/properties/:id and GET /api/properties/:id/images. The browse
// LIST is public, but a single listing is not readable without a token.
// Rather than render an empty page that fails with a 401, this page asks
// the visitor to log in. (Clicking through to a listing while logged out
// shows the log-in wall, not a crash.)
//
// Ownership is compared on `property.ownerId` — the backend's findPropertyById
// returns the raw row with no owner relation, so there is no owner email here.
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { getPropertyById } from "../../../../api/propertyApi";
import type { Property } from "../../../../api/types";
import { useAuthStore } from "../../../../Store/useUserStore";
import { formatDate, formatXAF, titleCase } from "../../../../lib/format";
import RequireAuth from "../../../../components/layout/RequireAuth";
import PageHeader from "../../../../components/layout/PageHeader";
import PropertyGallery from "../../../../components/properties/PropertyGallery";
import AmenityPanel from "../../../../components/properties/AmenityPanel";
import PropertyAdminActions from "../../../../components/properties/PropertyAdminActions";
import ApplyForm from "../../../../components/applications/ApplyForm";
import RequestViewingForm from "../../../../components/viewings/RequestViewingForm";
import Alert from "../../../../components/ui/Alert";
import { EmptyState, Loading } from "../../../../components/ui/States";
import StatusBadge from "../../../../components/ui/StatusBadge";

// The demo's detail tabs: one "All" panel that shows everything, then a tab
// per section.
const TABS = [
  { id: "all", label: "Overview" },
  { id: "description", label: "Description" },
  { id: "details", label: "Details" },
  { id: "amenities", label: "Amenities" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function PropertyDetailPage() {
  return (
    <RequireAuth title="This listing">
      <PropertyDetail />
    </RequireAuth>
  );
}

function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("all");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    getPropertyById(id)
      .then((data) => {
        if (active) setProperty(data);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Could not load this listing");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="rp-container detail-page">
        <Loading text="Loading listing…" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="rp-container detail-page">
        {error === "Property not found" ? (
          <EmptyState
            title="That listing no longer exists"
            description="It may have been deleted or archived by its owner."
            link={{ label: "Browse other properties", href: "/properties" }}
          />
        ) : (
          <>
            <PageHeader title="Listing" backHref="/properties" backLabel="All properties" />
            <div className="mt-6">
              <Alert variant="error">{error ?? "Could not load this listing"}</Alert>
            </div>
          </>
        )}
      </div>
    );
  }

  const isOwner = !!user && user.id === property.ownerId;
  const isTenant = user?.role === "TENANT";
  const acceptsRequests = property.status === "PUBLISHED";

  return (
    <div className="rp-container detail-page">
      {/* The demo's breadcrumb reads "Home / Villa / Individual Houses", so
          the middle crumb is the property type. */}
      <PageHeader
        title={property.title}
        backHref="/properties"
        backLabel={titleCase(property.propertyType)}
      />

      <div className="detail-content">
        {/* ---------------- Left: the listing itself ---------------- */}
        <div className="min-w-0">
          <PropertyGallery propertyId={property.id} />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <StatusBadge status={property.status} />
            {property.cautionFee ? (
              <span className="status-pill" data-tone="muted">
                Caution fee {formatXAF(property.cautionFee)}
              </span>
            ) : null}
          </div>

          <p className="detail-address mt-3">
            <MapPin className="h-4 w-4" aria-hidden />
            {property.neighborhood ? `${property.neighborhood}, ` : ""}
            {property.city}
            {property.address ? ` — ${property.address}` : ""}
          </p>

          <p className="detail-price">
            {formatXAF(property.monthlyRent)} <small>/ month</small>
          </p>

          {/* The demo's "Overview" box: quick facts in a bordered grid. */}
          <div className="detail-overview">
            <div>
              <span>Bedrooms</span>
              <strong>{property.bedrooms ?? "—"}</strong>
            </div>
            <div>
              <span>Bathrooms</span>
              <strong>{property.bathrooms ?? "—"}</strong>
            </div>
            <div>
              <span>Area size</span>
              <strong>{property.sizeSqm ? `${property.sizeSqm} m²` : "—"}</strong>
            </div>
            <div>
              <span>Type</span>
              <strong>{titleCase(property.propertyType)}</strong>
            </div>
            <div>
              <span>Monthly rent</span>
              <strong>{formatXAF(property.monthlyRent)}</strong>
            </div>
            <div>
              <span>Listed</span>
              <strong>{formatDate(property.createdAt)}</strong>
            </div>
          </div>

          <div className="detail-tabs" role="tablist" aria-label="Listing details">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                onClick={() => setTab(item.id)}
                className={tab === item.id ? "detail-tab is-active" : "detail-tab"}
              >
                {item.label}
              </button>
            ))}
          </div>

          {(tab === "all" || tab === "description") && (
            <div>
              <h2 className="panel-title">Description</h2>
              <p className="detail-body mt-3">
                {property.description ??
                  "The landlord hasn't written a description yet."}
              </p>
            </div>
          )}

          {(tab === "all" || tab === "details") && (
            <div className={tab === "all" ? "mt-10" : ""}>
              <h2 className="panel-title">Details</h2>
              <dl className="detail-list mt-4">
                <div>
                  <dt>Type</dt>
                  <dd>{titleCase(property.propertyType)}</dd>
                </div>
                <div>
                  <dt>Bedrooms</dt>
                  <dd>{property.bedrooms ?? "Not stated"}</dd>
                </div>
                <div>
                  <dt>Bathrooms</dt>
                  <dd>{property.bathrooms ?? "Not stated"}</dd>
                </div>
                <div>
                  <dt>Area size</dt>
                  <dd>{property.sizeSqm ? `${property.sizeSqm} m²` : "Not stated"}</dd>
                </div>
                <div>
                  <dt>Neighborhood</dt>
                  <dd>{property.neighborhood ?? "Not stated"}</dd>
                </div>
                <div>
                  <dt>Address</dt>
                  <dd>{property.address ?? "Not stated"}</dd>
                </div>
                <div>
                  <dt>Caution fee</dt>
                  <dd>
                    {property.cautionFee ? formatXAF(property.cautionFee) : "Not stated"}
                  </dd>
                </div>
                <div>
                  <dt>Last updated</dt>
                  <dd>{formatDate(property.updatedAt)}</dd>
                </div>
              </dl>
            </div>
          )}

          {(tab === "all" || tab === "amenities") && (
            <AmenityPanel propertyId={property.id} canManage={isOwner} />
          )}
        </div>

        {/* ---------------- Right: what you can do ---------------- */}
        <aside className="space-y-6">
          {/* The demo's sidebar contact card, used here for the owner's
              listing controls. */}
          {isOwner && (
            <div className="agent-card">
              <div className="agent-avatar">UR</div>
              <h3>Your listing</h3>
              <p className="agent-role">You own this property</p>

              <dl className="agent-rows">
                <div>
                  <dt>Status</dt>
                  <dd>{titleCase(property.status)}</dd>
                </div>
                <div>
                  <dt>Monthly rent</dt>
                  <dd>{formatXAF(property.monthlyRent)}</dd>
                </div>
                <div>
                  <dt>Caution fee</dt>
                  <dd>
                    {property.cautionFee ? formatXAF(property.cautionFee) : "Not stated"}
                  </dd>
                </div>
              </dl>

              <div className="mt-5">
                <PropertyAdminActions
                  property={property}
                  showEdit={false}
                  onChanged={setProperty}
                  onDeleted={() => router.push("/dashboard")}
                />
              </div>

              <Link
                href={`/dashboard/properties/${property.id}/edit`}
                className="btn btn-block mt-5"
              >
                Edit listing
              </Link>
            </div>
          )}

          {!isOwner && isTenant && acceptsRequests && (
            <>
              <ApplyForm propertyId={property.id} />
              <RequestViewingForm propertyId={property.id} />
            </>
          )}

          {!isOwner && isTenant && !acceptsRequests && (
            <Alert variant="info">
              This listing isn&apos;t published right now, so it isn&apos;t
              taking applications or viewing requests. Check back, or browse
              other properties.
            </Alert>
          )}

          {!isOwner && !isTenant && (
            <Alert variant="info">
              You&apos;re viewing a listing owned by another landlord. Only the
              owner can change it, and only tenants can apply for or view it.
            </Alert>
          )}
        </aside>
      </div>
    </div>
  );
}
