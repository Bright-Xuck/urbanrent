// ============================================================
// PROPERTY CARD
// ============================================================
// One row in a property list (browse page, featured section). Purely
// presentational — the page decides where it links and what data to pass.
// ============================================================

import Link from "next/link";
import { Bath, BedDouble, MapPin, Ruler } from "lucide-react";
import StatusBadge from "../ui/StatusBadge";
import { formatXAF } from "../../lib/format";

type PropertyCardProps = {
  index?: number;
  title: string;
  city: string;
  neighborhood?: string;
  bedrooms: number;
  bathrooms: number;
  sizeSqm?: number | null;
  monthlyRent: number;
  status?: string;
  /** The photo placeholder text (listings don't carry images in the API). */
  imageLabel?: string;
  href: string;
};

export default function PropertyCard({
  index,
  title,
  city,
  neighborhood,
  bedrooms,
  bathrooms,
  sizeSqm,
  monthlyRent,
  status,
  imageLabel = "Photo",
  href,
}: PropertyCardProps) {
  return (
    <Link
      href={href}
      className="group block border-b border-line py-6 first:pt-0 last:border-b-0"
    >
      <div className="flex gap-5">
        {index !== undefined && (
          <span className="w-8 shrink-0 pt-1 text-right font-display text-sm text-ink-soft">
            {String(index).padStart(2, "0")}
          </span>
        )}

        <div className="flex aspect-[4/3] w-36 shrink-0 items-center justify-center bg-paper-dim text-xs text-ink-soft sm:w-44">
          {imageLabel}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-display text-lg text-ink group-hover:text-navy">
              {title}
            </h3>
            {status && <StatusBadge status={status} />}
          </div>

          <p className="mt-1 flex items-center gap-1 text-sm text-ink-soft">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {neighborhood ? `${neighborhood}, ` : ""}
            {city}
          </p>

          <p className="mt-2 flex items-center gap-4 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" aria-hidden /> {bedrooms} bed
            </span>
            <span className="inline-flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" aria-hidden /> {bathrooms} bath
            </span>
            {sizeSqm ? (
              <span className="inline-flex items-center gap-1">
                <Ruler className="h-3.5 w-3.5" aria-hidden /> {sizeSqm} m²
              </span>
            ) : null}
          </p>

          <p className="mt-3 font-display text-base text-ink">
            {formatXAF(monthlyRent)}{" "}
            <span className="text-sm font-sans text-ink-soft">/ month</span>
          </p>
        </div>
      </div>
    </Link>
  );
}