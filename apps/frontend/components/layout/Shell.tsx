"use client";

// ============================================================
// SHELL
// ============================================================
// Public marketing pages share the public navbar and footer.
// ============================================================

import type { ReactNode } from "react";
import Footer from "./Footer";
import Navbar from "./Navbar";

export default function Shell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
