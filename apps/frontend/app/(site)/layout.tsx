// ============================================================
// (site) LAYOUT — public pages
// ============================================================
// Home, browse, listing detail, and the static marketing pages all
// share one frame: Navbar on top, Footer at the bottom. The pages
// themselves never render either.
// ============================================================

import type { ReactNode } from "react";
import SiteShell from "../../components/layout/SiteShell";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}