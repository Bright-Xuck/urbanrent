"use client";

import { useEffect, useState } from "react";
import { getPropertyAmenities } from "../../api/amenityApi";
import type { Property, PropertyAmenityRow } from "../../api/types";

type AmenityCount = { name: string; count: number };

export default function PropertyAmenities({ properties, loading }: { properties: Property[]; loading: boolean }) {
  const [amenities, setAmenities] = useState<AmenityCount[]>([]);
  const propertyIds = properties.map((property) => property.id).join(",");

  useEffect(() => {
    let active = true;
    if (!propertyIds) {
      setAmenities([]);
      return () => { active = false; };
    }

    const ids = propertyIds.split(",");
    void Promise.allSettled(ids.map((id) => getPropertyAmenities(id))).then((results) => {
      if (!active) return;
      const counts = new Map<string, number>();
      results.forEach((result) => {
        if (result.status !== "fulfilled") return;
        const uniqueNames = new Set((result.value as PropertyAmenityRow[]).map((row) => row.amenity.name));
        uniqueNames.forEach((name) => counts.set(name, (counts.get(name) ?? 0) + 1));
      });
      setAmenities(Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name)));
    });

    return () => { active = false; };
  }, [propertyIds]);

  return <section className="amenity-card" aria-label="Amenities in current results">
    <h2>Amenities <span>{loading ? "…" : amenities.length}</span></h2>
    {loading ? <p className="amenity-empty" role="status">Loading amenities…</p> : amenities.length ? <ul>
      {amenities.map(({ name, count }) => <li key={name}><span>{name}</span><span>{count}</span></li>)}
    </ul> : <p className="amenity-empty">No amenities listed in these results yet.</p>}
    <p className="amenity-footnote">Across the listings shown</p>
  </section>;
}
