"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, Plus, UserRound } from "lucide-react";
import { logout } from "../../api/userApi";
import { useAuthStore } from "../../Store/useUserStore";

export default function Navbar() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? `Signed out here, but the server did not confirm logout: ${error.message}`
          : "Signed out here, but the server did not confirm logout."
      );
    }
    router.replace("/");
  }

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
          <Link href="/properties">Properties</Link>

          {user && user.role !== "TENANT" ? (
            <Link href={user?.role === "ADMIN" ? "/admin" : "/landlord/properties"}>
              Dashboard
            </Link>
          ) : null}
        </nav>

        <div className="header-actions">
          {initialized && user ? (
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
                ) : initialized ? (
                  <Plus className="h-5 w-5" aria-hidden />
                ) : null}
                {primaryLabel}
              </Link>
            </>
          ) : initialized ? (
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
          ) : null}
        </div>
      </div>
    </header>
  );
}
