// ============================================================
// SITE SHELL
// ============================================================
// The page frame shared by the (site) and (app) route groups: Navbar on
// top, the page in the middle, Footer at the bottom. Pages inside those
// groups never render Navbar/Footer themselves — their group layout does.
//
// SessionBootstrap wraps the whole frame: it restores the session from the
// refresh cookie on a reload, and tells the protected pages inside (via
// context) that the answer is still pending — so a signed-in visitor sees
// "Checking your session…" instead of the log-in wall.
// ============================================================

import type { ReactNode } from "react";
import Footer from "./Footer";
import Navbar from "./Navbar";
import SessionBootstrap from "./SessionBootstrap";

export default function SiteShell({ children }: { children: ReactNode }) {
  return (
    <SessionBootstrap>
      <div className="flex min-h-screen flex-col bg-paper">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </SessionBootstrap>
  );
}