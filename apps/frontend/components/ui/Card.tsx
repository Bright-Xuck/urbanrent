// ============================================================
// CARD
// ============================================================
// The plain bordered white box used to group content on every page (the
// demo's sidebar blocks and content panels). The look lives in
// globals.css as `.panel`.
// ============================================================

import type { HTMLAttributes } from "react";

export default function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`panel ${className}`} />;
}