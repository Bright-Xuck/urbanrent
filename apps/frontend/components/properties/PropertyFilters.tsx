"use client";

// ============================================================
// PROPERTY FILTERS
// ============================================================
// The sidebar form on the browse page. It owns the raw input strings and
// only calls `onSearch` with a clean filter object when the form is
// submitted (or "Clear all" is pressed) — so typing never fires requests.
//
// These are exactly the filters GET /api/properties understands:
// propertyType, city, minRent, maxRent, minBedrooms.
// ============================================================

import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { Input, Select } from "../ui/Fields";
import type { PropertyFilters as FiltersInput } from "../../api/propertyApi";
import type { PropertyType } from "../../api/types";

const TYPES: PropertyType[] = [
  "APARTMENT",
  "STUDIO",
  "HOUSE",
  "VILLA",
  "COMMERCIAL",
  "OTHER",
];

type PropertyFiltersProps = {
  onSearch: (filters: FiltersInput) => void;
};

export default function PropertyFilters({ onSearch }: PropertyFiltersProps) {
  const [city, setCity] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [minRent, setMinRent] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const [minBedrooms, setMinBedrooms] = useState("");

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const filters: FiltersInput = {};

    if (city) filters.city = city;
    if (propertyType) filters.propertyType = propertyType as PropertyType;
    // Number("") is 0, which would filter everything away — only convert
    // the boxes that actually have something in them.
    if (minRent) filters.minRent = Number(minRent);
    if (maxRent) filters.maxRent = Number(maxRent);
    if (minBedrooms) filters.minBedrooms = Number(minBedrooms);

    onSearch(filters);
  }

  function handleClear() {
    setCity("");
    setPropertyType("");
    setMinRent("");
    setMaxRent("");
    setMinBedrooms("");
    onSearch({});
  }

  return (
    <form onSubmit={handleSearch} className="h-max border border-line p-6">
      <h2 className="font-display text-lg text-ink">Filter properties</h2>

      <Input
        label="City"
        type="text"
        value={city}
        onChange={(event) => setCity(event.target.value)}
        placeholder="e.g. Buea"
        className="mt-5"
      />

      <Select
        label="Property type"
        value={propertyType}
        onChange={(event) => setPropertyType(event.target.value)}
        className="mt-4"
      >
        <option value="">All types</option>
        {TYPES.map((type) => (
          <option key={type} value={type}>
            {type.charAt(0) + type.slice(1).toLowerCase()}
          </option>
        ))}
      </Select>

      <Input
        label="Minimum bedrooms"
        type="number"
        min={0}
        value={minBedrooms}
        onChange={(event) => setMinBedrooms(event.target.value)}
        className="mt-4"
      />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Input
          label="Min rent"
          type="number"
          min={0}
          value={minRent}
          onChange={(event) => setMinRent(event.target.value)}
        />
        <Input
          label="Max rent"
          type="number"
          min={0}
          value={maxRent}
          onChange={(event) => setMaxRent(event.target.value)}
        />
      </div>

      <p className="mt-3 text-xs text-ink-soft">Rent is in XAF per month.</p>

      <button
        type="submit"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 border border-navy bg-navy px-4 py-2.5 text-sm text-paper hover:bg-navy-dark"
      >
        <Search className="h-4 w-4" aria-hidden /> Search properties
      </button>

      <button
        type="button"
        onClick={handleClear}
        className="mt-3 w-full border border-line px-4 py-2.5 text-sm text-ink hover:border-ink"
      >
        Clear all
      </button>
    </form>
  );
}