"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Flag,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
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
    { href: "/profile", label: "My profile", icon: Users },
  ],
  LANDLORD: [
    { href: "/landlord/properties", label: "My properties", icon: Building2 },
    { href: "/landlord/applications", label: "Applications", icon: FileText },
    { href: "/landlord/viewings", label: "Viewings", icon: CalendarDays },
    { href: "/landlord/properties/new", label: "Add a property", icon: Plus },
    { href: "/landlord/verification", label: "Verification", icon: BadgeCheck },
    { href: "/profile", label: "My profile", icon: Users },
  ],
  ADMIN: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/verification", label: "Verification queue", icon: BadgeCheck },
    { href: "/admin/moderation", label: "Listing moderation", icon: Flag },
    { href: "/profile", label: "My profile", icon: Users },
  ],
};

const ROLE_HOME: Record<Role, string> = {
  TENANT: "/tenant",
  LANDLORD: "/landlord",
  ADMIN: "/admin",
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
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (initialized && user && user.role !== role) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [initialized, role, router, user]);

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? `Signed out here, but the server did not confirm logout: ${error.message}`
          : "Signed out here, but the server did not confirm logout."
      );
    } finally {
      useAuthStore.getState().logout();
    }
    router.replace("/");
  }

  if (!initialized) {
    return (
      <main className="mx-auto max-w-7xl px-5 py-12 text-sm text-ink-soft" role="status">
        Checking your sign-in…
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-7xl flex-col items-start justify-center gap-4 px-5 py-12">
        <h1 className="font-display text-2xl font-semibold text-ink">Sign in to continue</h1>
        <p className="text-sm text-ink-soft">This area is for signed-in UrbanRent members.</p>
        <Link className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white" href="/login">
          Go to sign in
        </Link>
      </main>
    );
  }

  if (user.role !== role) return null;

  const navigation = (
    <nav aria-label={`${role.toLowerCase()} navigation`} className="dashboard-nav">
      {NAVIGATION[role].map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`dashboard-nav-link ${
              active
                ? "is-active"
                : ""
            }`}
            href={href}
            key={href}
            onClick={() => setMenuOpen(false)}
          >
            <Icon aria-hidden="true" className="h-[17px] w-[17px]" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const roleLabel = role === "TENANT" ? "Resident space" : role === "LANDLORD" ? "Owner space" : "Admin space";
  const firstName = user.email?.split("@")[0] || "there";

  return (
    <div className={`dashboard-shell dashboard-${role.toLowerCase()}`}>
      <div className={`dashboard-mobile-bar ${menuOpen ? "is-open" : ""}`}>
        <Link href="/" className="dashboard-brand"><span>UR</span><strong>UrbanRent</strong></Link>
        <button aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation" : "Open navigation"} onClick={() => setMenuOpen((open) => !open)} type="button">{menuOpen ? <X /> : <Menu />}</button>
      </div>
      <aside className={`dashboard-sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="dashboard-sidebar-top"><Link href="/" className="dashboard-brand"><span>UR</span><strong>UrbanRent</strong></Link><span className="dashboard-role">{roleLabel}</span></div>
        <div className="dashboard-nav-label">Workspace</div>{navigation}
        <div className="dashboard-sidebar-bottom"><Link href="/" className="dashboard-back-home">← Back to site</Link><button className="dashboard-signout" onClick={handleLogout} type="button"><LogOut /> Sign out</button></div>
      </aside>
      <div className="dashboard-canvas">
        <header className="dashboard-topbar"><div><span className="dashboard-section-kicker">{roleLabel}</span><h1>Good morning, {firstName}</h1></div><div className="dashboard-top-actions"><span className="dashboard-date">{new Intl.DateTimeFormat("en", { weekday: "long", month: "short", day: "numeric" }).format(new Date())}</span><Link href="/profile" className="dashboard-avatar" aria-label="Open profile">{firstName.slice(0, 1).toUpperCase()}</Link></div></header>
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
