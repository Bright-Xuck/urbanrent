"use client";

// ============================================================
// DASHBOARD NAVBAR
// ============================================================
// The slim top bar for the signed-in area — (app)/dashboard/*, plus the
// tenant pages /applications and /viewings. It replaces the marketing
// Navbar once you're logged in: no Blog, no Features dropdown, no
// "Sign up" — just the things each role actually uses.
//
// What each role sees:
//   TENANT   → Browse, My applications, My viewings | Log out
//   LANDLORD → Listings, Applications, Viewing requests, Add listing | Log out
//   ADMIN    → same as LANDLORD
//
// "Back to site" drops out of the dashboard onto the public pages. The
// round avatar goes to /my-profile as before. Log out calls
// POST /api/auth/logout (revoking the refresh cookie server-side) then
// clears the local store, mirroring the public Navbar.
// ============================================================

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarDays,
  FileText,
  Home,
  LogOut,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import { logout } from "../../api/userApi";
import { useAuthStore } from "../../Store/useUserStore";
import type { Role } from "../../api/types";

type DashLink = {
  href: string;
  label: string;
  icon: typeof Building2;
  roles: Role[];
};

// One list, role-filtered — the same pattern as DashboardSidebar so the
// two stay in sync. Tenant links and landlord links never mix: a tenant's
// "Applications" is what they SUBMITTED (/applications); a landlord's
// "Applications" is what they RECEIVED (/dashboard/applications).
const LINKS: DashLink[] = [
  {
    href: "/dashboard",
    label: "Listings",
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
    label: "Add listing",
    icon: Plus,
    roles: ["LANDLORD", "ADMIN"],
  },
  {
    href: "/properties",
    label: "Browse",
    icon: Search,
    roles: ["TENANT"],
  },
  {
    href: "/applications",
    label: "My applications",
    icon: FileText,
    roles: ["TENANT"],
  },
  {
    href: "/viewings",
    label: "My viewings",
    icon: CalendarDays,
    roles: ["TENANT"],
  },
];

export default function DashboardNavbar() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.logout);

  const role = user?.role;
  const links = LINKS.filter((link) => role && link.roles.includes(role));

  async function handleLogout() {
    // If the cookie is already dead this throws — we still clear locally.
    try {
      await logout();
    } catch {
      // ignore and continue
    }
    clearSession();
    router.push("/");
  }

  // While the session is still being restored there is no user yet. The
  // (app) layout keeps the public Navbar until then — this component is
  // only mounted once we know someone is signed in.
  if (!user) return null;

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-navy font-display text-xs text-navy">
            UR
          </span>
          <span className="font-display text-lg text-ink">UrbanRent</span>
        </Link>

        <nav className="main-nav">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Icon className="inline h-3.5 w-3.5" aria-hidden /> {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="header-actions">
          <Link
            href="/properties"
            className="inline-flex items-center gap-1.5 text-sm text-ink-soft underline hover:text-ink"
            title="Back to the public site"
          >
            <Home className="h-4 w-4" aria-hidden /> Back to site
          </Link>

          <Link
            href="/my-profile"
            className="user-icon"
            aria-label="My profile"
            title="My profile"
          >
            <UserRound className="h-5 w-5" aria-hidden />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="create-listing"
            style={{ background: "#111b2d" }}
          >
            <LogOut className="h-5 w-5" aria-hidden /> Log out
          </button>
        </div>
      </div>
    </header>
  );
}
