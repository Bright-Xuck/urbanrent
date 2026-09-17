"use client";

// ============================================================
// DASHBOARD SIDEBAR
// ============================================================
// The landlord's little nav inside the (app)/dashboard section. Mounted by
// app/(app)/dashboard/layout.tsx. Highlights the link matching the current
// URL so you always know where you are.
// ============================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, PlusCircle } from "lucide-react";

const LINKS = [
  { href: "/dashboard", label: "My properties", icon: Building2 },
  { href: "/dashboard/properties/new", label: "Add a listing", icon: PlusCircle },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-max border border-line p-4">
      <nav className="flex flex-col gap-1">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 px-3 py-2.5 text-sm ${
                active ? "bg-paper-dim text-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}