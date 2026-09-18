// ============================================================
// PROPERTY CARD
// ============================================================
// One card in a property grid (the home page's featured strip, the listing
// page). Purely presentational — the page decides where it links and what
// data to pass.
//
// Layout follows the demo card: photo on top with a status pill over it,
// then price, title, address and a beds/baths/area meta row. The list
// endpoints don't return photo URLs, so the image well shows a placeholder
// here — real photos appear on the detail page, which fetches them.
// ============================================================

import Link from "next/link";
import { Bath, BedDouble, MapPin, Ruler } from "lucide-react";
import { formatXAF } from "../../lib/format";

type PropertyCardProps = {
  title: string;
  city: string;
  neighborhood?: string;
  bedrooms: number;
  bathrooms: number;
  sizeSqm?: number | null;
  monthlyRent: number;
  /** A property status. Omitted on public browse, where every row is published. */
  status?: string;
  href: string;
};

// The pill over the photo. The marketplace is rent-only, so a published
// listing reads "For rent" — the demo's "For Rent" badge.
function badgeFor(status?: string): { label: string; muted: boolean } {
  switch (status) {
    case "DRAFT":
      return { label: "Draft", muted: true };
    case "UNPUBLISHED":
      return { label: "Unpublished", muted: true };
    case "ARCHIVED":
      return { label: "Archived", muted: true };
    default:
      return { label: "For rent", muted: false };
  }
}

export default function PropertyCard({
  title,
  city,
  neighborhood,
  bedrooms,
  bathrooms,
  sizeSqm,
  monthlyRent,
  status,
  href,
}: PropertyCardProps) {
  const pill = badgeFor(status);

  return (
    <Link href={href} className="property-card">
      <div className="property-image">
        <span className={pill.muted ? "badge badge-muted" : "badge"}>{pill.label}</span>
        <div className="property-image-placeholder">No photo yet</div>
      </div>

      <div className="property-info">
        <p className="price">
          {formatXAF(monthlyRent)} <small>/ month</small>
        </p>
        <h3>{title}</h3>
        <p className="property-address">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {neighborhood ? `${neighborhood}, ` : ""}
          {city}
        </p>

        <div className="meta">
          <span>
            <BedDouble className="h-3.5 w-3.5" aria-hidden /> {bedrooms} Beds
          </span>
          <span>
            <Bath className="h-3.5 w-3.5" aria-hidden /> {bathrooms} Baths
          </span>
          {sizeSqm ? (
            <span>
              <Ruler className="h-3.5 w-3.5" aria-hidden /> {sizeSqm} m²
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}