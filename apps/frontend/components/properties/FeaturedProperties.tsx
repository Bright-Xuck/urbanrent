"use client";

// ============================================================
// FEATURED PROPERTIES
// ============================================================
// The "latest listings" strip on the home page. Fetches the public browse
// endpoint with a small limit — no session needed.
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
      <div className="flex items-end justify-between">
        <h2 className="font-display text-2xl text-ink">Latest listings</h2>
        <Link
          href="/properties"
          className="inline-flex items-center gap-1 text-sm text-navy underline"
        >
          See all <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="mt-6 border-t border-line">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            title={property.title}
            city={property.city}
            neighborhood={property.neighborhood ?? undefined}
            bedrooms={property.bedrooms ?? 0}
            bathrooms={property.bathrooms ?? 0}
            monthlyRent={property.monthlyRent}
            status={property.status}
            href={`/property/${property.id}`}
          />
        ))}
      </div>
    </section>
  );
}