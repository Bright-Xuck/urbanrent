// ============================================================
// DASHBOARD LAYOUT — landlord section
// ============================================================
// Sidebar on the left, page content on the right. The sidebar is only shown
// to landlords and admins (read from the Zustand store) — a tenant or a
// visitor during session restore sees an empty column instead of a sidebar
// with no links in it.
// ============================================================

"use client";

import { useAuthStore } from "../../../Store/useUserStore";
import type { ReactNode } from "react";
import DashboardSidebar from "../../../components/layout/DashboardSidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const role = useAuthStore((state) => state.user?.role);
  const isLandlord = role === "LANDLORD" || role === "ADMIN";

  return (
    <div className="rp-container rp-section">
      <div className="grid items-start gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        {isLandlord ? <DashboardSidebar /> : <div />}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}