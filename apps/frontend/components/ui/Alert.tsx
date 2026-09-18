// ============================================================
// ALERT
// ============================================================
// The coloured note used for feedback everywhere: "Changes saved.",
// API errors, the "amenities can't be listed yet" warning, etc.
// Looks come from the `.alert*` rules in globals.css.
// ============================================================

import type { ReactNode } from "react";

type AlertProps = {
  variant?: "success" | "error" | "warning" | "info";
  children: ReactNode;
};

const VARIANTS = {
  success: "alert alert-success",
  error: "alert alert-error",
  warning: "alert alert-warning",
  info: "alert alert-info",
};

export default function Alert({ variant = "info", children }: AlertProps) {
  return (
    <p role={variant === "error" ? "alert" : "status"} className={VARIANTS[variant]}>
      {children}
    </p>
  );
}