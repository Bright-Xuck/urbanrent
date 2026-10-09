"use client";

// ============================================================
// ADMIN SIDEBAR
// ============================================================
// The admin's nav inside the /admin section — same pattern as
// DashboardSidebar: one LINKS array, map it to <Link>, highlight the
// current pathname. Features that aren't built yet are still real
// links (they 404 until we build the page — accepted trade-off, so
// the nav always shows the full roadmap).
// Mounted by app/(app)/admin/layout.tsx, which has already confirmed
// the visitor is an ADMIN before any of this renders.
// ============================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  BarChart3,
  LayoutDashboard,
  Scale,
  ShieldAlert,
  Users,
} from "lucide-react";

type AdminLink = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const LINKS: AdminLink[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/verification", label: "Landlord verification", icon: BadgeCheck },
  { href: "/admin/moderation", label: "Listing moderation", icon: ShieldAlert },
  { href: "/admin/stats", label: "Platform stats", icon: BarChart3 },
  { href: "/admin/disputes", label: "Disputes", icon: Scale },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="panel h-max">
      <nav className="flex flex-col gap-1">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={active ? "side-link is-active" : "side-link"}
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
