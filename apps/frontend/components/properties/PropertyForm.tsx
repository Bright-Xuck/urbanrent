"use client";

// ============================================================
// PROPERTY FORM
// ============================================================
// The listing form shared by BOTH the "new property" page and the "edit"
// page — before this existed, the same ~100 lines of fields lived in two
// places and drifted.
//
// The component owns the raw input strings and hands the parent a ready
// `CreatePropertyInput` body (numbers already converted, empty optional
// fields left out). It does NOT call the API itself — that's the page's
// job, because the two pages do different things with the body:
//
//   new page  → onSubmit(body)            creates a DRAFT
//               secondary.onAction(body)  creates it PUBLISHED
//   edit page → onSubmit(body)            PATCHes the property
//
// The backend requires title, city, and monthlyRent — those inputs are
// marked `required` so the browser blocks the submit before we send.
// ============================================================

import { useState, type FormEvent, type ReactNode } from "react";
import { Input, Select, Textarea } from "../ui/Fields";
import { titleCase } from "../../lib/format";
import type { CreatePropertyInput } from "../../api/propertyApi";
import type { PropertyType } from "../../api/types";

const TYPES: PropertyType[] = [
  "APARTMENT",
  "STUDIO",
  "HOUSE",
  "VILLA",
  "COMMERCIAL",
  "OTHER",
];

// What a page can prefill (the edit page passes the loaded property;
// everything is a string because inputs work in strings).
export type PropertyFormInitial = Partial<{
  title: string;
  description: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  sizeSqm: string;
  city: string;
  neighborhood: string;
  address: string;
  monthlyRent: string;
  cautionFee: string;
}>;

type PropertyFormProps = {
  initial?: PropertyFormInitial;
  pending?: boolean;
  error?: string | null;
  submitLabel: string;
  onSubmit: (body: CreatePropertyInput) => void | Promise<void>;
  /** Optional second action button (the new page's "Publish listing"). */
  secondary?: {
    label: string;
    onAction: (body: CreatePropertyInput) => void | Promise<void>;
  };
  /** Rendered after the buttons. */
  children?: ReactNode;
};

export default function PropertyForm({
  initial,
  pending = false,
  error = null,
  submitLabel,
  onSubmit,
  secondary,
  children,
}: PropertyFormProps) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    propertyType: initial?.propertyType ?? "APARTMENT",
    bedrooms: initial?.bedrooms ?? "",
    bathrooms: initial?.bathrooms ?? "",
    sizeSqm: initial?.sizeSqm ?? "",
    city: initial?.city ?? "",
    neighborhood: initial?.neighborhood ?? "",
    address: initial?.address ?? "",
    monthlyRent: initial?.monthlyRent ?? "",
    cautionFee: initial?.cautionFee ?? "",
  });

  function update(field: keyof typeof form, value: string) {
    setForm({ ...form, [field]: value });
  }

  // Strings → the typed body the API expects. Only filled-in numbers get
  // converted, because Number("") is 0 and would overwrite a real value.
  function buildBody(): CreatePropertyInput {
    return {
      title: form.title,
      description: form.description || undefined,
      propertyType: form.propertyType as PropertyType,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
      sizeSqm: form.sizeSqm ? Number(form.sizeSqm) : undefined,
      city: form.city,
      neighborhood: form.neighborhood || undefined,
      address: form.address || undefined,
      monthlyRent: Number(form.monthlyRent),
      cautionFee: form.cautionFee ? Number(form.cautionFee) : undefined,
    };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(buildBody());
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-8">
        <section className="border border-line p-6">
          <h2 className="font-display text-lg text-ink">Basic details</h2>

          <Input
            label="Title"
            required
            value={form.title}
            onChange={(event) => update("title", event.target.value)}
            placeholder="e.g. 2-bedroom apartment, Molyko"
            className="mt-4"
          />

          <Textarea
            label="Description"
            rows={4}
            value={form.description}
            onChange={(event) => update("description", event.target.value)}
            placeholder="Describe the property, its condition, and what's nearby."
            className="mt-4"
          />

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Select
              label="Type"
              value={form.propertyType}
              onChange={(event) => update("propertyType", event.target.value)}
            >
              {TYPES.map((type) => (
                <option key={type} value={type}>
                  {titleCase(type)}
                </option>
              ))}
            </Select>
            <Input
              label="Bedrooms"
              type="number"
              min={0}
              value={form.bedrooms}
              onChange={(event) => update("bedrooms", event.target.value)}
            />
            <Input
              label="Bathrooms"
              type="number"
              min={0}
              value={form.bathrooms}
              onChange={(event) => update("bathrooms", event.target.value)}
            />
            <Input
              label="Size (m²)"
              type="number"
              min={0}
              value={form.sizeSqm}
              onChange={(event) => update("sizeSqm", event.target.value)}
            />
          </div>
        </section>

        <section className="border border-line p-6">
          <h2 className="font-display text-lg text-ink">Location &amp; pricing</h2>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <Input
              label="City"
              required
              value={form.city}
              onChange={(event) => update("city", event.target.value)}
              placeholder="e.g. Buea"
            />
            <Input
              label="Neighborhood"
              value={form.neighborhood}
              onChange={(event) => update("neighborhood", event.target.value)}
              placeholder="e.g. Molyko"
            />
            <Input
              label="Address"
              value={form.address}
              onChange={(event) => update("address", event.target.value)}
              className="col-span-2"
            />
            <Input
              label="Monthly rent (XAF)"
              type="number"
              min={0}
              required
              value={form.monthlyRent}
              onChange={(event) => update("monthlyRent", event.target.value)}
            />
            <Input
              label="Caution fee (XAF)"
              type="number"
              min={0}
              placeholder="Optional"
              value={form.cautionFee}
              onChange={(event) => update("cautionFee", event.target.value)}
            />
          </div>
        </section>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 border-t border-line pt-6">
          <button
            type="submit"
            disabled={pending}
            className="border border-navy bg-navy px-5 py-2.5 text-sm text-paper hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Saving…" : submitLabel}
          </button>

          {secondary && (
            <button
              type="button"
              disabled={pending}
              onClick={() => secondary.onAction(buildBody())}
              className="border border-line px-5 py-2.5 text-sm text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {secondary.label}
            </button>
          )}
        </div>
      </div>

      {children}
    </form>
  );
}