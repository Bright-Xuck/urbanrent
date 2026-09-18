"use client";

// ============================================================
// BROWSE PROPERTIES — GET /api/properties (public)
// ============================================================
// The marketplace, laid out like the demo's listing page: breadcrumb and
// page title over a filter sidebar plus a card grid.
//
// The backend does the filtering AND the paging, and answers with the
// envelope { properties, total, offset, limit, totalPages } — this page just
// renders that. Pagination's `page` is 1-based for humans; the offset sent
// over the wire is 0-based, and that conversion lives in one place.
//
// The query params the home page's hero search writes
// (/properties?city=Buea&propertyType=HOUSE&maxRent=150000) seed both the
// first fetch and the filter card, so the two can never disagree.
//
// NOTE: `useSearchParams` needs a Suspense boundary or `next build` refuses
// to prerender the page — hence the small split at the bottom.
// ============================================================

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { Building2 } from "lucide-react";
import {
  getProperties,
  type PropertyFilters as FilterValues,
} from "../../../api/propertyApi";
import type { Property, PropertyType } from "../../../api/types";
import PageHeader from "../../../components/layout/PageHeader";
import PropertyCard from "../../../components/properties/PropertyCard";
import PropertyFilters, {
  PROPERTY_TYPES,
} from "../../../components/properties/PropertyFilters";
import Alert from "../../../components/ui/Alert";
import Pagination from "../../../components/ui/Pagination";
import { EmptyState, Loading } from "../../../components/ui/States";

const PAGE_SIZE = 10;

// Turns the URL params the home search writes into a filter object. Anything
// missing — or a propertyType that isn't a real enum member — is left out, so
// a hand-edited URL can't send junk to the backend.
function readFilters(params: ReadonlyURLSearchParams): FilterValues {
  const filters: FilterValues = {};

  const city = params.get("city");
  const type = params.get("propertyType");
  const minBedrooms = Number(params.get("minBedrooms")) || 0;
  const maxRent = Number(params.get("maxRent")) || 0;

  if (city) filters.city = city;
  if (type && PROPERTY_TYPES.includes(type as PropertyType)) {
    filters.propertyType = type as PropertyType;
  }
  if (minBedrooms > 0) filters.minBedrooms = minBedrooms;
  if (maxRent > 0) filters.maxRent = maxRent;

  return filters;
}

function BrowseContent() {
  const searchParams = useSearchParams();
  // A plain string, so it can be used as an effect dependency and as the
  // filter card's key (remount = the form re-seeds from the URL).
  const paramKey = searchParams.toString();

  const [filters, setFilters] = useState<FilterValues>(() => readFilters(searchParams));
  const [page, setPage] = useState(1);

  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // A navigation that changes the query params (a second hero search, a link
  // with filters baked in) restarts the search from page 1.
  useEffect(() => {
    setFilters(readFilters(searchParams));
    setPage(1);
  }, [paramKey, searchParams]);

  useEffect(() => {
    // A stale response arriving after the visitor already changed page or
    // filters would overwrite the current list — `active` drops it.
    let active = true;

    setLoading(true);
    setError(null);

    getProperties(filters, {
      offset: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    })
      .then((data) => {
        if (!active) return;
        setProperties(data.properties);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch((err: unknown) => {
        if (!active) return;
        // 400 (minRent > maxRent) and any server error land here with the
        // message the backend sent.
        setError(err instanceof Error ? err.message : "Could not load properties");
        setProperties([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters, page]);

  function handleSearch(next: FilterValues) {
    // A new filter set always starts from the first page, otherwise a
    // narrow filter could land on a page number that no longer exists.
    setPage(1);
    setFilters(next);
  }

  return (
    <div className="rp-container listing-page">
      <PageHeader
        title="Property listing"
        subtitle={
          total > 0
            ? `${total} published listing${total === 1 ? "" : "s"} available`
            : "Published listings from landlords, newest first."
        }
      />

      <div className="listing-layout mt-8">
        {/* The key re-mounts the card when the URL params change (a second
            hero search), so the inputs always match the results shown. */}
        <PropertyFilters key={paramKey} initial={filters} onSearch={handleSearch} />

        <div>
          {error && <Alert variant="error">{error}</Alert>}

          {loading && <Loading text="Loading properties…" />}

          {!loading && !error && properties.length === 0 && (
            <EmptyState
              icon={Building2}
              title="No properties match those filters"
              description="Try widening the rent range, or clear the city."
            />
          )}

          {!loading && properties.length > 0 && (
            <div className="property-grid">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  title={property.title}
                  city={property.city}
                  neighborhood={property.neighborhood ?? undefined}
                  bedrooms={property.bedrooms ?? 0}
                  bathrooms={property.bathrooms ?? 0}
                  sizeSqm={property.sizeSqm}
                  monthlyRent={property.monthlyRent}
                  href={`/property/${property.id}`}
                />
              ))}
            </div>
          )}

          {!loading && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPrevious={() => setPage((current) => current - 1)}
              onNext={() => setPage((current) => current + 1)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrowsePropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-6 py-10">
          <Loading text="Loading properties…" />
        </div>
      }
    >
      <BrowseContent />
    </Suspense>
  );
}
