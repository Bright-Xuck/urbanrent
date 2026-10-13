"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, Menu, Plus, UserRound, X } from "lucide-react";
import { logout } from "../../api/userApi";
import { useAuthStore } from "../../Store/useUserStore";

export default function Navbar() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const [mobileOpen, setMobileOpen] = useState(false);

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
    <header className={`site-header${mobileOpen ? " mobile-open" : ""}`}>
      <div className="header-inner">
        <Link href="/" className="brand">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full border border-navy font-display text-xs text-navy"
          >
            UR
          </span>
          <span className="font-display text-lg text-ink">UrbanRent</span>
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          <Link className="active" href="/" onClick={() => setMobileOpen(false)}>Home</Link>
          <Link href="/properties" onClick={() => setMobileOpen(false)}>Properties</Link>

          {user && user.role !== "TENANT" ? (
            <Link href={user?.role === "ADMIN" ? "/admin" : "/landlord/properties"} onClick={() => setMobileOpen(false)}>
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

        <button className="mobile-menu-toggle" type="button" aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={mobileOpen} aria-controls="mobile-navigation" onClick={() => setMobileOpen((open) => !open)}>
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
      <div className="mobile-navigation" id="mobile-navigation" aria-hidden={!mobileOpen}>
        <nav aria-label="Mobile navigation">
          <Link href="/" onClick={() => setMobileOpen(false)}>Home<span>01</span></Link>
          <Link href="/properties" onClick={() => setMobileOpen(false)}>Properties<span>02</span></Link>
          {user && user.role !== "TENANT" ? <Link href={user.role === "ADMIN" ? "/admin" : "/landlord/properties"} onClick={() => setMobileOpen(false)}>Dashboard<span>03</span></Link> : null}
        </nav>
        {initialized ? <div className="mobile-navigation-actions">
          {user ? <Link href="/profile" onClick={() => setMobileOpen(false)}><UserRound size={17} />My profile</Link> : <Link href="/login" onClick={() => setMobileOpen(false)}><LogIn size={17} />Log in</Link>}
          <Link className="mobile-primary-action" href={primaryHref} onClick={() => setMobileOpen(false)}>{user && !isTenant ? <Plus size={17} /> : null}{primaryLabel}<span aria-hidden>↗</span></Link>
          {user ? <button type="button" onClick={handleLogout}><LogOut size={16} />Log out</button> : null}
        </div> : null}
      </div>
    </header>
  );
}
