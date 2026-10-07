"use client";

// ============================================================
// SHELL
// ============================================================
// Page frame shared by the (site) and (app) route groups: the right navbar
// on top, the page in the middle, Footer at the bottom.
//
// Which navbar shows depends on the variant and on whether anyone is signed
// in (read from the Zustand store — no context needed):
//   (site)  → Navbar always (the public bar, with a light "you're logged in"
//              state when a session exists).
//   (app)   → DashboardNavbar when a user is present, else Navbar as a
//              fallback while the session is being restored.
//
// Session restore runs once per mount via useSessionRestore() — it trades the
// refresh cookie for an access token and puts the decoded user back in the
// store. <RequireAuth> walls read `sessionRestoring` from the store and show
// "Checking your session…" while that is in flight.
// ============================================================

import type { ReactNode } from "react";
import Footer from "./Footer";
import Navbar from "./Navbar";
import DashboardNavbar from "./DashboardNavbar";
import { useSessionRestore } from "./useSessionRestore";
import { useAuthStore } from "../../Store/useUserStore";

type ShellVariant = "site" | "app";

export default function Shell({
  children,
  variant,
}: {
  children: ReactNode;
  variant: ShellVariant;
}) {
  useSessionRestore();

  const user = useAuthStore((state) => state.user);

  const navbar =
    variant === "app" && user ? (
      <DashboardNavbar />
    ) : (
      <Navbar />
    );

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {navbar}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
