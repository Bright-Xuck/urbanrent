// ============================================================
// INPUT / SELECT / TEXTAREA
// ============================================================
// Shared look for every form control. The style is `.field` in
// globals.css: label on top, rounded control, blue focus ring.
//
// `className` goes on the wrapping <label> because most callers use it
// for layout ("mt-4", "col-span-2", "max-w-xs").
// ============================================================

import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type BaseFieldProps = {
  label?: string;
  className?: string;
};

type InputProps = BaseFieldProps & InputHTMLAttributes<HTMLInputElement>;

export function Input({
  label,
  className = "",
  ...props
}: InputProps) {
  return (
    <label className={`field ${className}`}>
      {label && <span className="label">{label}</span>}
      <input {...props} />
    </label>
  );
}

type SelectProps = BaseFieldProps & SelectHTMLAttributes<HTMLSelectElement>;

export function Select({
  label,
  className = "",
  children,
  ...props
}: SelectProps) {
  return (
    <label className={`field ${className}`}>
      {label && <span className="label">{label}</span>}
      <select {...props}>{children}</select>
    </label>
  );
}

type TextareaProps = BaseFieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({
  label,
  className = "",
  ...props
}: TextareaProps) {
  return (
    <label className={`field ${className}`}>
      {label && <span className="label">{label}</span>}
      <textarea {...props} />
    </label>
  );
}