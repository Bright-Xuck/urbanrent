// ============================================================
// BUTTON
// ============================================================
// The four looks used across the app, defined once. Sizes/spacing are
// still passed through `className` when a page needs something special.
// ============================================================

import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "success" | "danger-outline" | "ghost";
};

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "border border-navy bg-navy text-paper hover:bg-navy-dark",
  outline: "border border-line text-ink hover:border-ink",
  success: "border border-verified bg-verified text-paper",
  "danger-outline": "border border-danger text-danger hover:border-danger",
  ghost: "text-ink-soft underline hover:text-ink",
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
      className={`${VARIANTS[variant]} disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  );
}