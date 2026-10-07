// ============================================================
// (app) LAYOUT — signed-in area
// ============================================================
// Dashboard, applications, viewings, and profile share one frame (Shell)
// that shows the role-aware DashboardNavbar once the session is known, with
// Footer below. Each page still guards itself with <RequireAuth> so a
// logged-out visitor sees the log-in wall instead of broken data calls.
// ============================================================

import type { ReactNode } from "react";
import Shell from "../../components/layout/Shell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <Shell variant="app">{children}</Shell>;
}