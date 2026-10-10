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
// Role-specific navigation lives in the authenticated area shell.
//
// Blog and the "Features" dropdown were removed — they were duplicate
// clutter pointing at /properties.
// ============================================================

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogIn, LogOut, Plus, UserRound } from "lucide-react";
import { logout } from "../../api/userApi";
import { useAuthStore } from "../../Store/useUserStore";

export default function Navbar() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const sessionStatus = useAuthStore((state) => state.sessionStatus);
  const clearSession = useAuthStore((state) => state.logout);
  const sessionNotice = useAuthStore((state) => state.sessionNotice);

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
    router.push("/");
  }

  // One primary CTA per state, no duplicates:
  //   logged out  → "Sign up"     /register
  //   TENANT      → "My applications"  /applications
  //   LANDLORD / ADMIN → "My listings"  /dashboard
  const isTenant = user?.role === "TENANT";
  const primaryHref = !user
    ? "/register"
    : isTenant
      ? "/tenant/applications"
      : user.role === "ADMIN"
        ? "/admin"
        : "/landlord/properties";
  const primaryLabel = !user ? "Sign up" : isTenant ? "My applications" : "My listings";

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="brand">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full border border-navy font-display text-xs text-navy"
          >
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

          <Link href="/properties?propertyType=HOUSE">Property</Link>

          <div className="nav-dropdown">
            <Link href="/properties">Features <ChevronDown aria-hidden /></Link>
            <div className="dropdown-menu compact">
              <Link href="/properties">Find a home</Link>
              <Link href="/properties">Rental guide</Link>
            </div>
          </div>

          {user && user.role !== "TENANT" ? (
            <Link href={user?.role === "ADMIN" ? "/admin" : "/landlord/properties"}>
              Dashboard
            </Link>
          ) : null}
        </nav>

        <div className="header-actions">
          {sessionStatus === "checking" ? (
            <span className="text-sm text-ink-soft" role="status">
              Checking sign-in…
            </span>
          ) : null}
          {sessionStatus === "error" ? (
            <span className="max-w-56 text-xs text-danger" role="status">
              Sign-in status could not be checked.
            </span>
          ) : null}
          {sessionNotice ? (
            <p className="max-w-56 text-xs text-danger" role="status">
              {sessionNotice}
            </p>
          ) : null}
          {user ? (
            <>
              <Link
                href="/profile"
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
                {isTenant ? (
                  <UserRound className="h-5 w-5" aria-hidden />
                ) : (
                  <Plus className="h-5 w-5" aria-hidden />
                )}
                {primaryLabel}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="user-icon"
                aria-label="Log in"
                title="Log in"
              >
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
