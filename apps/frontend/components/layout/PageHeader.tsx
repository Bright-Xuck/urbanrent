// ============================================================
// PAGE HEADER
// ============================================================
// The "← Back to …" link + big title + one-line subtitle that sits at the
// top of most pages. One component instead of the same six lines again.
// ============================================================

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
};

export default function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Back",
}: PageHeaderProps) {
  return (
    <div>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> {backLabel}
        </Link>
      )}

      <h1 className="mt-2 font-display text-3xl text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
    </div>
  );
}