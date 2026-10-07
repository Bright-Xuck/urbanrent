// ============================================================
// BUTTON
// ============================================================
// Styled wrapper around a real <button>. The look comes from
// globals.css (.btn + the variant/size classes), so a plain button
// elsewhere can wear the same style.
//
// Size/layout modifiers are theme classes ("btn-sm", "btn-block") so
// they keep winning over equal-specificity utilities.
// ============================================================

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "success" | "danger-outline" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "btn",
  outline: "btn btn-light",
  success: "btn btn-success",
  "danger-outline": "btn btn-danger",
  ghost: "btn btn-ghost",
};

export default function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${VARIANT_CLASS[variant]} ${className}`}
      {...props}
    />
  );
}