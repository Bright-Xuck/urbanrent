import StatusBadge from "./StatusBadge";

export default function PropertyCard({
  index,
  title,
  city,
  neighborhood,
  bedrooms,
  bathrooms,
  monthlyRent,
  status,
  imageLabel = "Photo",
  href = "/property/1",
}) {
  return (
    <a
      href={href}
      className="group block border-b border-line py-6 first:pt-0 last:border-b-0"
    >
      <div className="flex gap-5">
        <span className="w-8 shrink-0 pt-1 text-right font-display text-sm text-ink-soft">
          {String(index).padStart(2, "0")}
        </span>

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
          <p className="mt-1 text-sm text-ink-soft">
            {neighborhood ? `${neighborhood}, ` : ""}
            {city}
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            {bedrooms} bed · {bathrooms} bath
          </p>
          <p className="mt-3 font-display text-base text-ink">
            {monthlyRent.toLocaleString()} XAF{" "}
            <span className="text-sm font-sans text-ink-soft">/ month</span>
          </p>
        </div>
      </div>
    </a>
  );
}
