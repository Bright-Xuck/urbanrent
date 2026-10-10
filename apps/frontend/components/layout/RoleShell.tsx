"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import type { Role } from "../../api/types";
import { logout } from "../../api/userApi";
import { useAuthStore } from "../../Store/useUserStore";

type NavigationItem = {
  href: string;
  label: string;
  icon: typeof Building2;
};

const NAVIGATION: Record<Role, readonly NavigationItem[]> = {
  TENANT: [
    { href: "/properties", label: "Browse homes", icon: Search },
    { href: "/tenant/applications", label: "My applications", icon: FileText },
    { href: "/tenant/viewings", label: "My viewings", icon: CalendarDays },
    { href: "/tenant/profile", label: "My profile", icon: Users },
  ],
  LANDLORD: [
    { href: "/landlord/properties", label: "My properties", icon: Building2 },
    { href: "/landlord/applications", label: "Applications", icon: FileText },
    { href: "/landlord/viewings", label: "Viewings", icon: CalendarDays },
    { href: "/landlord/properties/new", label: "Add a property", icon: Plus },
    { href: "/landlord/verification", label: "Verification", icon: BadgeCheck },
    { href: "/landlord/profile", label: "My profile", icon: Users },
  ],
  ADMIN: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/verification", label: "Verification queue", icon: BadgeCheck },
    { href: "/admin/profile", label: "My profile", icon: Users },
  ],
};

export function RoleShell({
  children,
  role,
}: {
  children: ReactNode;
  role: Role;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.logout);
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      clearSession(
        error instanceof Error
          ? `You are signed out on this device, but the server did not confirm logout: ${error.message}`
          : "You are signed out on this device, but the server did not confirm logout."
      );
      return;
    }

    clearSession();
    router.replace("/");
  }

  const navigation = (
    <nav aria-label={`${role.toLowerCase()} navigation`} className="grid gap-1">
      {NAVIGATION[role].map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-navy text-white"
                : "text-ink-soft hover:bg-paper-dim hover:text-ink"
            }`}
            href={href}
            key={href}
            onClick={() => setMenuOpen(false)}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-paper-dim">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:px-8 lg:py-8">
        <header className="flex items-center justify-between rounded-xl border border-line bg-white p-3 lg:hidden">
          <Link className="font-display text-lg font-semibold text-navy" href="/">
            UrbanRent
          </Link>
          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            className="grid h-10 w-10 place-items-center rounded-lg border border-line text-ink"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            {menuOpen ? (
              <X aria-hidden="true" className="h-5 w-5" />
            ) : (
              <Menu aria-hidden="true" className="h-5 w-5" />
            )}
          </button>
        </header>

        <aside
          className={`${menuOpen ? "block" : "hidden"} rounded-xl border border-line bg-white p-3 lg:sticky lg:top-6 lg:block lg:h-fit`}
        >
          <div className="mb-4 hidden border-b border-line px-3 pb-4 pt-2 lg:block">
            <Link className="font-display text-xl font-semibold text-navy" href="/">
              UrbanRent
            </Link>
          </div>
          {navigation}
          <button
            className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-ink-soft hover:bg-paper-dim hover:text-ink"
            onClick={handleLogout}
            type="button"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            Sign out
          </button>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
