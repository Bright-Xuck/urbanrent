// ============================================================
// ALERT
// ============================================================
// The coloured note used for feedback everywhere: "Changes saved.",
// API errors, the "amenities can't be listed yet" warning, etc.
// ============================================================

import type { ReactNode } from "react";

type AlertProps = {
  variant?: "success" | "error" | "warning" | "info";
  children: ReactNode;
};

const VARIANTS = {
  success: "border-verified text-verified",
  error: "border-danger text-danger",
  warning: "border-ochre text-ochre-dark",
  info: "border-line text-ink-soft",
};

export default function Alert({ variant = "info", children }: AlertProps) {
  return (
    <p role={variant === "error" ? "alert" : "status"} className={`px-3 py-2 text-sm ${VARIANTS[variant]}`}>
      {children}
    </p>
  );
}