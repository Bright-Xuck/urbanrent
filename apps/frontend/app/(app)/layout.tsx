// ============================================================
// (app) LAYOUT — signed-in area
// ============================================================
// Dashboard, applications, viewings, and profile share their own frame:
// AppShell renders the role-aware DashboardNavbar (instead of the
// marketing Navbar) once the session is known, with Footer below.
// Each page still guards itself with <RequireAuth> so a logged-out
// visitor sees the log-in wall instead of broken data calls.
// ============================================================

import type { ReactNode } from "react";
import AppShell from "../../components/layout/AppShell";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}