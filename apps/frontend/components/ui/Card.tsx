// ============================================================
// CARD
// ============================================================
// Plain bordered box used to group content on most pages. The look is
// `.panel` in globals.css.
// ============================================================

import type { HTMLAttributes } from "react";

export default function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`panel ${className}`} {...props} />;
}