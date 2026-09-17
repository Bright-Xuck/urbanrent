// ============================================================
// CARD
// ============================================================
// The plain bordered box that groups content on every page (the property
// form sections, the sidebar on the detail page, etc.). One class list,
// defined once.
// ============================================================

import type { HTMLAttributes } from "react";

export default function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`border border-line p-6 ${className}`} />;
}