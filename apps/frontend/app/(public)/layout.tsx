// ============================================================
// Public pages share the marketing navigation and footer.
// ============================================================
// Home, browse, listing detail, and the static marketing pages all
// share one frame (Shell) that shows the public Navbar, with Footer below.
// The pages themselves never render either.
// ============================================================

import type { ReactNode } from "react";
import Shell from "../../components/layout/Shell";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <Shell>{children}</Shell>;
}