"use client";

// ============================================================
// FEATURED PROPERTIES
// ============================================================
// The "Featured properties" strip on the home page — the demo's centred
// section head plus a card grid. Fetches the public browse endpoint with a
// small limit, so no session is needed.
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProperties } from "../../api/propertyApi";
import type { Property } from "../../api/types";
import Alert from "../ui/Alert";
import PropertyCard from "./PropertyCard";

export default function FeaturedProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProperties() {
      try {
        const data = await getProperties({}, { limit: 6 });
        setProperties(data.properties);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load properties.");
      } finally {
        setLoading(false);
      }
    }

    void loadProperties();
  }, []);

  return (
    <section>
      <div className="section-head">
        <span className="eyebrow">Featured properties</span>
        <h2>Latest listings</h2>
        <p>Homes published by landlords on UrbanRent, newest first.</p>
      </div>

      {loading ? (
        <p className="text-center text-sm text-ink-soft" role="status">
          Loading properties…
        </p>
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : properties.length === 0 ? (
        <p className="text-center text-sm text-ink-soft">
          No published properties are available yet.
        </p>
      ) : (
        <>
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
                verified={property.owner?.verificationState === "VERIFIED"}
                href={`/property/${property.id}`}
              />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/properties" className="btn btn-outline">
              Explore all properties
            </Link>
          </div>
        </>
      )}
    </section>
  );
}