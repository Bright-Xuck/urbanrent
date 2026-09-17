// ============================================================
// EMPTY STATE + LOADING
// ============================================================
// The "nothing here yet" box and the "Loading…" line that every data page
// used to build by hand.
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
    <div className="border border-line p-8 text-center">
      {Icon && <Icon className="mx-auto h-8 w-8 text-ink-soft" aria-hidden />}
      <p className="mt-3 font-display text-lg text-ink">{title}</p>
      {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      {link && (
        <Link href={link.href} className="mt-4 inline-block text-sm text-navy underline">
          {link.label}
        </Link>
      )}
    </div>
  );
}

export function Loading({ text = "Loading…" }: { text?: string }) {
  return <p className="text-sm text-ink-soft">{text}</p>;
}