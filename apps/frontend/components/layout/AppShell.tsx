"use client";

// ============================================================
// APP SHELL — signed-in area frame
// ============================================================
// Same frame as SiteShell (SessionBootstrap → Navbar → main → Footer)
// but once the session is known, the marketing Navbar is replaced by
// DashboardNavbar: the role-aware bar with only that role's links.
//
// Must be a client component: it reads the auth store to decide which
// navbar to show, and it renders SessionBootstrap, which owns the
// "session restoring" context the RequireAuth walls below depend on.
// ============================================================

import type { ReactNode } from "react";
import Footer from "./Footer";
import Navbar from "./Navbar";
import DashboardNavbar from "./DashboardNavbar";
import SessionBootstrap from "./SessionBootstrap";
import { useAuthStore } from "../../Store/useUserStore";

export default function AppShell({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);

  return (
    <SessionBootstrap>
      <div className="flex min-h-screen flex-col bg-paper">
        {user ? <DashboardNavbar /> : <PublicFallbackNavbar />}
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </SessionBootstrap>
  );
}

// While the session is restoring (or nobody is signed in — e.g. the
// RequireAuth wall is about to show) we still need a header. Reuse the
// public Navbar for that moment so the frame never goes blank.
function PublicFallbackNavbar() {
  return <Navbar />;
}
