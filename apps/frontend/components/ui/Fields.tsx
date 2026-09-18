// ============================================================
// INPUT / SELECT / TEXTAREA
// ============================================================
// One shared look for every form control (the `.field` rules in
// globals.css: label above, rounded control, blue focus ring).
//
// `className` lands on the WRAPPER <label>, not on the control, because
// call sites use it for layout ("mt-4", "col-span-2", "max-w-xs") and the
// grid/flex parent is the wrapper.
// ============================================================

import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string };

export function Input({ label, className = "", ...props }: InputProps) {
  return (
    <label className={`field ${className}`}>
      {label && <span className="label">{label}</span>}
      <input {...props} />
    </label>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label?: string };

export function Select({ label, className = "", children, ...props }: SelectProps) {
  return (
    <label className={`field ${className}`}>
      {label && <span className="label">{label}</span>}
      <select {...props}>{children}</select>
    </label>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export function Textarea({ label, className = "", ...props }: TextareaProps) {
  return (
    <label className={`field ${className}`}>
      {label && <span className="label">{label}</span>}
      <textarea {...props} />
    </label>
  );
}