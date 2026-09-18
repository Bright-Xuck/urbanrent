"use client";

// ============================================================
// DASHBOARD SIDEBAR
// ============================================================
// The landlord's little nav inside the (app)/dashboard section. Mounted by
// app/(app)/dashboard/layout.tsx. Highlights the link matching the current
// URL so you always know where you are.
//
// ROLE-AWARE: applications + viewing requests are LANDLORD/ADMIN-only
// sections, so a tenant wandering into /dashboard (they'd hit the
// RequireAuth wall anyway) never sees those links. /dashboard itself is
// LANDLORD/ADMIN only too — a tenant has no listings of their own.
// ============================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CalendarDays, FileText, PlusCircle } from "lucide-react";
import { useAuthStore } from "../../Store/useUserStore";
import type { Role } from "../../api/types";

type SidebarLink = {
  href: string;
  label: string;
  icon: typeof Building2;
  /** Roles allowed to see the link; omit = any signed-in user. */
  roles?: Role[];
};

const LINKS: SidebarLink[] = [
  {
    href: "/dashboard",
    label: "My properties",
    icon: Building2,
    roles: ["LANDLORD", "ADMIN"],
  },
  {
    href: "/dashboard/applications",
    label: "Applications",
    icon: FileText,
    roles: ["LANDLORD", "ADMIN"],
  },
  {
    href: "/dashboard/viewings",
    label: "Viewing requests",
    icon: CalendarDays,
    roles: ["LANDLORD", "ADMIN"],
  },
  {
    href: "/dashboard/properties/new",
    label: "Add a listing",
    icon: PlusCircle,
    roles: ["LANDLORD", "ADMIN"],
  },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const role = useAuthStore((state) => state.user?.role);

  const visibleLinks = LINKS.filter(
    (link) => !link.roles || (role && link.roles.includes(role))
  );

  return (
    <aside className="panel h-max">
      <nav className="flex flex-col gap-1">
        {visibleLinks.map((link) => {
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