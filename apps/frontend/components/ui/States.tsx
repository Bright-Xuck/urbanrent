// ============================================================
// EMPTY STATE + LOADING
// ============================================================
// The "nothing here yet" box and the "Loading…" line that every data page
// used to build by hand. Looks live in globals.css (.empty-state,
// .loading-line).
// ============================================================

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  link?: { label: string; href: string };
};

export function EmptyState({ icon: Icon, title, description, link }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {Icon && <Icon className="mx-auto h-9 w-9 text-ink-soft" aria-hidden />}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {link && <Link href={link.href}>{link.label}</Link>}
    </div>
  );
}

export function Loading({ text = "Loading…" }: { text?: string }) {
  return <p className="loading-line">{text}</p>;
}