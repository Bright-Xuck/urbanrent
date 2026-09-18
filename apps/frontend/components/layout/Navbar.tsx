"use client";

// ============================================================
// NAVBAR — public / marketing site
// ============================================================
// Reads the session from the store, so what it shows depends on who is
// logged in:
//   nobody      → Log in icon + "Sign up" button
//   signed in   → avatar, "Log out" + ONE role-appropriate primary CTA.
//                 No Log in, no Sign up — you're already in.
//
// The signed-in area has its own bar (DashboardNavbar): once you're in,
// the marketing pages show just a light "you're logged in" state, and
// the dashboards carry the role-specific links (listings, applications,
// viewings). Blog is gone — it was a dead dropdown pointing at
// /properties; the tenant "Features" dropdown was the same clutter.
// ============================================================

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogIn, LogOut, Plus, UserRound } from "lucide-react";
import { logout } from "../../api/userApi";
import { useAuthStore } from "../../Store/useUserStore";

export default function Navbar() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.logout);

  async function handleLogout() {
    // If the cookie is already dead this throws — that's fine, we still
    // want to clear the local session.
    try {
      await logout();
    } catch {
      // ignore and continue
    }

    clearSession();
    router.push("/");
  }

  // One primary CTA per state, no duplicates:
  //   logged out → "Sign up"  |  TENANT → "My applications"
  //   LANDLORD/ADMIN → "My listings" (the dashboard)
  const primaryHref = !user
    ? "/register"
    : user.role === "TENANT"
      ? "/applications"
      : "/dashboard";
  const primaryLabel = !user
    ? "Sign up"
    : user.role === "TENANT"
      ? "My applications"
      : "My listings";

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
          <Link className="active" href="/">Home</Link>
          <div className="nav-dropdown">
            <Link href="/properties">Properties <ChevronDown aria-hidden /></Link>
            <div className="dropdown-menu">
              <Link href="/properties">All properties</Link>
              <Link href="/properties?propertyType=HOUSE">Houses</Link>
              <Link href="/properties?propertyType=APARTMENT">Apartments</Link>
            </div>
          </div>
          <Link href="/property/demo">Property</Link>
          <div className="nav-dropdown">
            <Link href="/properties">Features <ChevronDown aria-hidden /></Link>
            <div className="dropdown-menu compact">
              <Link href="/properties">Find a home</Link>
              <Link href="/properties">Rental guide</Link>
            </div>
          </div>
          {user && user.role !== "TENANT" ? <Link href="/dashboard">Dashboard</Link> : null}
        </nav>

        <div className="header-actions">
          {user ? (
            <>
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
                className="inline-flex items-center gap-1.5 text-sm text-ink-soft underline hover:text-ink"
              >
                <LogOut className="h-4 w-4" aria-hidden /> Log out
              </button>

              <Link className="create-listing" href={primaryHref}>
                {user.role === "TENANT" ? (
                  <UserRound className="h-5 w-5" aria-hidden />
                ) : (
                  <Plus className="h-5 w-5" aria-hidden />
                )}
                {primaryLabel}
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="user-icon" aria-label="Log in" title="Log in">
                <LogIn className="h-5 w-5" aria-hidden />
              </Link>
              <Link className="create-listing" href="/register">
                <Plus className="h-5 w-5" aria-hidden /> Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
