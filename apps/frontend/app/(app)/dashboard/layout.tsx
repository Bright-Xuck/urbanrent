// ============================================================
// DASHBOARD LAYOUT — landlord section
// ============================================================
// Sidebar on the left, page content on the right. The sidebar lives in
// components/layout/DashboardSidebar.tsx, so renaming a link or adding a
// new section touches exactly one file.
// ============================================================

import type { ReactNode } from "react";
import DashboardSidebar from "../../../components/layout/DashboardSidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid items-start gap-8 lg:grid-cols-[240px_1fr]">
        <DashboardSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}