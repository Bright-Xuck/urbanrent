"use client";

// ============================================================
// NAVBAR
// ============================================================
// Reads the session from the store, so what it shows depends on who is
// logged in:
//   nobody      → Log in / Sign up
//   TENANT      → "My applications"
//   LANDLORD    → "My listings" (the dashboard)
//   ADMIN       → dashboard too
// The round button goes to /my-profile; the small "Log out" button calls
// POST /api/auth/logout (revoking the refresh cookie on the server) and
// then clears the store.
// ============================================================

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, Plus, SquarePen, UserRound } from "lucide-react";
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
          <Link className="active" href="/">
            Home
          </Link>
          <Link href="/properties">Properties</Link>
          <Link href="/about-us">About us</Link>
          <Link href="/faqs">FAQs</Link>
          <Link href="/contact-us">Contact us</Link>
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

              <Link
                className="create-listing"
                href={user.role === "TENANT" ? "/applications" : "/dashboard"}
              >
                {user.role === "TENANT" ? (
                  <SquarePen className="h-5 w-5" aria-hidden />
                ) : (
                  <Plus className="h-5 w-5" aria-hidden />
                )}
                {user.role === "TENANT" ? "My applications" : "My listings"}
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