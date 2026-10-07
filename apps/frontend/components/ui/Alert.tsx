// ============================================================
// ALERT
// ============================================================
// Coloured note used for feedback everywhere: "Changes saved.", API
// errors, warnings, and so on. The look is in globals.css (.alert*).
// ============================================================

import type { ReactNode } from "react";

type AlertVariant = "success" | "error" | "warning" | "info";

type AlertProps = {
  variant?: AlertVariant;
  children: ReactNode;
};

const VARIANT_CLASS: Record<AlertVariant, string> = {
  success: "alert alert-success",
  error: "alert alert-error",
  warning: "alert alert-warning",
  info: "alert alert-info",
};

export default function Alert({
  variant = "info",
  children,
}: AlertProps) {
  return (
    <p
      role={variant === "error" ? "alert" : "status"}
      className={VARIANT_CLASS[variant]}
    >
      {children}
    </p>
  );
}