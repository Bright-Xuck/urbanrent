// ============================================================
// PAGE HEADER
// ============================================================
// The breadcrumb + big title + one-line subtitle that sits at the top of
// most pages, matching the demo's "Home / Property Listing" pattern.
//
// `backHref`/`backLabel` feed the middle crumb (the demo's "Home / Villa /
// Individual Houses"), so callers keep passing the same props they always
// did — only the rendering changed.
// ============================================================

import Link from "next/link";

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
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        {backHref && (
          <>
            <span className="sep" aria-hidden>
              /
            </span>
            <Link href={backHref}>{backLabel}</Link>
          </>
        )}
        <span className="sep" aria-hidden>
          /
        </span>
        <span>{title}</span>
      </nav>

      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-sub">{subtitle}</p>}
    </div>
  );
}