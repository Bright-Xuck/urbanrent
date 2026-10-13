"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Bath, BedDouble, MapPin } from "lucide-react";
import { getProperties } from "../../api/propertyApi";
import type { Property } from "../../api/types";
import Alert from "../ui/Alert";
import { formatXAF } from "../../lib/format";

const PHOTOS = [
  "photo-1600607687939-ce8a6c25118c", "photo-1600585154340-be6161a56a0c",
  "photo-1600607687920-4e2a09cf159d", "photo-1600566753086-00f18fb6b3ea",
  "photo-1600047509807-ba8f99d2cdde", "photo-1600210492486-724fe5c67fb0",
];

export default function FeaturedProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getProperties({}, { limit: 8 }).then((data) => setProperties(data.properties))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Could not load properties."))
      .finally(() => setLoading(false));
  }, []);

  function move(direction: number) {
    if (!rail.current) return;
    rail.current.scrollBy({ left: direction * (rail.current.clientWidth * 0.72), behavior: "smooth" });
  }

  return <section className="home-featured rp-section">
    <div className="rp-container">
      <div className="featured-heading reveal"><div><span className="home-kicker">A few places to begin</span><h2>Featured <em>homes.</em></h2><p>Explore the latest rental homes shared on UrbanRent.</p></div><div className="carousel-controls"><button type="button" aria-label="Previous homes" onClick={() => move(-1)}><ArrowLeft size={19} /></button><button type="button" aria-label="Next homes" onClick={() => move(1)}><ArrowRight size={19} /></button></div></div>
      {loading ? <p className="text-center text-sm text-ink-soft" role="status">Finding homes…</p> : error ? <Alert variant="error">{error}</Alert> : properties.length === 0 ? <div className="featured-empty"><p>No published homes just yet.</p><Link href="/properties">Browse properties <span aria-hidden>↗</span></Link></div> :
        <div className="featured-rail" ref={rail}>{properties.map((property, index) => <HomeCard key={property.id} property={property} index={index} />)}</div>}
      <div className="featured-bottom"><Link href="/properties" className="story-link">Discover all homes <span aria-hidden>↗</span></Link><span>Scroll to explore <span aria-hidden>→</span></span></div>
    </div>
  </section>;
}

function HomeCard({ property, index }: { property: Property; index: number }) {
  return <Link href={`/property/${property.id}`} className="home-property-card">
    <div className="home-property-photo"><img src={`https://images.unsplash.com/${PHOTOS[index % PHOTOS.length]}?auto=format&fit=crop&w=900&h=1000&q=85`} alt={property.title} loading="lazy" /><span className="home-property-badge">For rent</span></div>
    <div className="home-property-info"><p className="home-property-price">{formatXAF(property.monthlyRent)}<small> / month</small></p><h3>{property.title}</h3><p className="home-property-location"><MapPin size={14} />{property.neighborhood ? `${property.neighborhood}, ` : ""}{property.city}</p><div className="home-property-meta"><span><BedDouble size={16} />{property.bedrooms ?? 0} beds</span><span><Bath size={16} />{property.bathrooms ?? 0} baths</span></div></div>
  </Link>;
}
