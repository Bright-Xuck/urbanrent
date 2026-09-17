// ============================================================
// SITE SHELL
// ============================================================
// The page frame shared by the (site) and (app) route groups: Navbar on
// top, the page in the middle, Footer at the bottom. Pages inside those
// groups never render Navbar/Footer themselves — their group layout does.
// ============================================================

import type { ReactNode } from "react";
import Footer from "./Footer";
import Navbar from "./Navbar";

export default function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}