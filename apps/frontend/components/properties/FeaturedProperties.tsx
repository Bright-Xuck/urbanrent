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
import PropertyCard from "./PropertyCard";

export default function FeaturedProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getProperties({}, { limit: 6 })
      .then((data) => setProperties(data.properties))
      .catch(() => setFailed(true));
  }, []);

  if (failed) return null;
  if (properties.length === 0) return null;

  return (
    <section>
      <div className="section-head">
        <span className="eyebrow">Featured properties</span>
        <h2>Latest listings</h2>
        <p>Homes published by landlords on UrbanRent, newest first.</p>
      </div>

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

      <div className="mt-12 text-center">
        <Link href="/properties" className="btn btn-outline">
          Explore all properties
        </Link>
      </div>
    </section>
  );
}