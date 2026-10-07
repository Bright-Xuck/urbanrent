"use client";

// ============================================================
// PROPERTY FORM
// ============================================================
// Listing form shared by BOTH the "new property" page and the "edit" page.
// Before this existed, the same ~100 lines of fields lived in two places and
// drifted.
//
// The component owns the raw input strings and hands the parent a ready
// `CreatePropertyInput` body (numbers already converted, empty optional
// fields left out). It does NOT call the API itself — that's the page's job,
// because the two pages do different things with the body:
//
//   new page  → onSubmit(body)            creates a DRAFT
//               secondary.onAction(body)  creates it PUBLISHED
//   edit page → onSubmit(body)            PATCHes the property
//
// The backend requires title, city, and monthlyRent — those inputs are marked
// `required` so the browser blocks the submit before we send.
//
// The backend expects JSON, so we still send JSON. The form is a real <form> so
// we can read values from the DOM instead of holding every field in state; the
// shape conversion still happens explicitly because the API wants a typed
// object, not a flat form dump.
// ============================================================

import { useRef, type FormEvent, type ReactNode } from "react";
import Alert from "../ui/Alert";
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

// What a page can prefill (the edit page passes the loaded property; everything
// is a string because inputs work in strings).
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
  const formRef = useRef<HTMLFormElement>(null);

  /** Reads the current form values from the DOM and converts them to the shape
   * the API expects. Used by both the submit handler and the secondary action,
   * so the body always reflects what is actually on screen. */
  function buildBody(form: HTMLFormElement): CreatePropertyInput {
    const data = Object.fromEntries(form.entries());

    return {
      title: data.title as string,
      description: data.description ? String(data.description) : undefined,
      propertyType: (data.propertyType as PropertyType) ?? "APARTMENT",
      bedrooms: data.bedrooms ? Number(data.bedrooms) : undefined,
      bathrooms: data.bathrooms ? Number(data.bathrooms) : undefined,
      sizeSqm: data.sizeSqm ? Number(data.sizeSqm) : undefined,
      city: data.city as string,
      neighborhood: data.neighborhood ? String(data.neighborhood) : undefined,
      address: data.address ? String(data.address) : undefined,
      monthlyRent: Number(data.monthlyRent),
      cautionFee: data.cautionFee ? Number(data.cautionFee) : undefined,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(buildBody(event.currentTarget));
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <div>
        <section className="panel">
          <h2 className="panel-title">Basic details</h2>

          <div className="mt-5">
            <Input
              name="title"
              label="Title"
              required
              defaultValue={initial?.title ?? ""}
              placeholder="e.g. 2-bedroom apartment, Molyko"
            />
          </div>

          <Textarea
            name="description"
            label="Description"
            rows={4}
            defaultValue={initial?.description ?? ""}
            placeholder="Describe the property, its condition, and what's nearby."
          />

          <div className="form-grid-4">
            <Select
              name="propertyType"
              label="Type"
              defaultValue={initial?.propertyType ?? "APARTMENT"}
            >
              {TYPES.map((type) => (
                <option key={type} value={type}>
                  {titleCase(type)}
                </option>
              ))}
            </Select>
            <Input
              name="bedrooms"
              label="Bedrooms"
              type="number"
              min={0}
              defaultValue={initial?.bedrooms ?? ""}
            />
            <Input
              name="bathrooms"
              label="Bathrooms"
              type="number"
              min={0}
              defaultValue={initial?.bathrooms ?? ""}
            />
            <Input
              name="sizeSqm"
              label="Size (m²)"
              type="number"
              min={0}
              defaultValue={initial?.sizeSqm ?? ""}
            />
          </div>
        </section>

        <section className="panel">
          <h2 className="panel-title">Location &amp; pricing</h2>

          <div className="form-grid mt-5">
            <Input
              name="city"
              label="City"
              required
              defaultValue={initial?.city ?? ""}
              placeholder="e.g. Buea"
            />
            <Input
              name="neighborhood"
              label="Neighborhood"
              defaultValue={initial?.neighborhood ?? ""}
              placeholder="e.g. Molyko"
            />
            <Input
              name="address"
              label="Address"
              defaultValue={initial?.address ?? ""}
              className="col-span-2"
            />
            <Input
              name="monthlyRent"
              label="Monthly rent (XAF)"
              type="number"
              min={0}
              required
              defaultValue={initial?.monthlyRent ?? ""}
            />
            <Input
              name="cautionFee"
              label="Caution fee (XAF)"
              type="number"
              min={0}
              placeholder="Optional"
              defaultValue={initial?.cautionFee ?? ""}
            />
          </div>
        </section>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="form-actions">
          <button type="submit" disabled={pending} className="btn">
            {pending ? "Saving…" : submitLabel}
          </button>

          {secondary && (
            <button
              type="button"
              disabled={pending}
              onClick={() => secondary.onAction(buildBody(formRef.current!))}
              className="btn btn-light"
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