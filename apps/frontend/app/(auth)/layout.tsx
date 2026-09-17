// ============================================================
// (auth) LAYOUT — login + register
// ============================================================
// These two pages have their own centered designs (logo up top, form
// below), so this layout is deliberately bare: no Navbar, no Footer.
// ============================================================

import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}