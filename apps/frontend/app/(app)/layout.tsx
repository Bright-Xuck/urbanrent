// ============================================================
// (app) LAYOUT — signed-in area
// ============================================================
// Dashboard, applications, viewings, and profile share the same frame
// as the public site: Navbar on top (which reads the store, so it shows
// "My applications" / "My listings" once you're in), Footer below.
// Each page still guards itself with <RequireAuth> so a logged-out
// visitor sees the log-in wall instead of broken data calls.
// ============================================================

import type { ReactNode } from "react";
import SiteShell from "../../components/layout/SiteShell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}