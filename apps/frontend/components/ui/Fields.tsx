// ============================================================
// INPUT / SELECT / TEXTAREA
// ============================================================
// One shared look for every form control. Each one optionally renders its
// own <label>, which is what every form on the site wraps around its
// inputs anyway — so a page goes from six lines per field to one.
// ============================================================

import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const CONTROL_CLASS =
  "mt-1.5 w-full border border-line bg-paper px-3 py-2.5 text-ink placeholder:text-ink-soft/60";

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label?: string };

export function Input({ label, className = "", ...props }: InputProps) {
  return (
    <label className="block text-sm">
      {label && <span className="text-ink">{label}</span>}
      <input {...props} className={`${CONTROL_CLASS} ${className}`} />
    </label>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label?: string };

export function Select({ label, className = "", children, ...props }: SelectProps) {
  return (
    <label className="block text-sm">
      {label && <span className="text-ink">{label}</span>}
      <select {...props} className={`${CONTROL_CLASS} ${className}`}>
        {children}
      </select>
    </label>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export function Textarea({ label, className = "", ...props }: TextareaProps) {
  return (
    <label className="block text-sm">
      {label && <span className="text-ink">{label}</span>}
      <textarea {...props} className={`${CONTROL_CLASS} ${className}`} />
    </label>
  );
}