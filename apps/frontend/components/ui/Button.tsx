// ============================================================
// BUTTON
// ============================================================
// The button looks live in globals.css (.btn + modifiers) so a plain
// <button> or <a> elsewhere can wear the same style; this component is
// just the typed wrapper.
//
// Size modifiers are theme classes too ("btn-sm", "btn-block") rather
// than Tailwind padding — the theme layer is unlayered, so it outranks a
// utility of equal specificity.
// ============================================================

import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "success" | "danger-outline" | "ghost";
};

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
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
      {...props}
      type={type}
      className={`${VARIANTS[variant]} ${className}`}
    />
  );
}