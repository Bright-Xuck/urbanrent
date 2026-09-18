"use client";

// ============================================================
// PROPERTY FILTERS
// ============================================================
// The sidebar card on the listing page, styled like the demo's filter
// panel: property-type pills across the top, then the fields, then the
// action buttons.
//
// It owns the raw input strings and only calls `onSearch` with a clean
// filter object when the form is submitted (or "Clear all" is pressed), so
// typing never fires requests. The type pills are the one exception — like
// the demo, choosing one filters straight away.
//
// These are exactly the filters GET /api/properties understands:
// propertyType, city, minRent, maxRent, minBedrooms.
// ============================================================

import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import type { PropertyFilters as FiltersInput } from "../../api/propertyApi";
import type { PropertyType } from "../../api/types";
import { titleCase } from "../../lib/format";

// Exported so the home page's hero search can offer the same list without
// keeping a second copy in sync.
export const PROPERTY_TYPES: PropertyType[] = [
  "APARTMENT",
  "STUDIO",
  "HOUSE",
  "VILLA",
  "COMMERCIAL",
  "OTHER",
];

type PropertyFiltersProps = {
  /** Starting values. The home-page search box links to /properties?city=…,
   *  and the browse page passes that city in here so the form matches the
   *  results instead of looking empty. */
  initial?: FiltersInput;
  onSearch: (filters: FiltersInput) => void;
};

export default function PropertyFilters({ initial, onSearch }: PropertyFiltersProps) {
  // Inputs only understand strings, so the numeric starting values are
  // stringified once here. `undefined` (no filter) stays an empty box.
  const [city, setCity] = useState(initial?.city ?? "");
  const [propertyType, setPropertyType] = useState<string>(initial?.propertyType ?? "");
  const [minRent, setMinRent] = useState(
    initial?.minRent !== undefined ? String(initial.minRent) : ""
  );
  const [maxRent, setMaxRent] = useState(
    initial?.maxRent !== undefined ? String(initial.maxRent) : ""
  );
  const [minBedrooms, setMinBedrooms] = useState(
    initial?.minBedrooms !== undefined ? String(initial.minBedrooms) : ""
  );

  // Number("") is 0, which would filter everything away — only the boxes
  // that actually have something in them are converted.
  function buildFilters(): FiltersInput {
    const filters: FiltersInput = {};

    if (city) filters.city = city;
    if (propertyType) filters.propertyType = propertyType as PropertyType;
    if (minRent) filters.minRent = Number(minRent);
    if (maxRent) filters.maxRent = Number(maxRent);
    if (minBedrooms) filters.minBedrooms = Number(minBedrooms);

    return filters;
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(buildFilters());
  }

  // The type pills filter on click, the way the demo's tabs do.
  function handleType(type: string) {
    setPropertyType(type);

    const filters = buildFilters();
    if (type) filters.propertyType = type as PropertyType;
    else delete filters.propertyType;

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
    <form onSubmit={handleSearch} className="filter-card">
      <h2>Filter properties</h2>

      <div className="filter-tabs" role="group" aria-label="Property type">
        <button
          type="button"
          onClick={() => handleType("")}
          className={propertyType === "" ? "filter-tab is-active" : "filter-tab"}
          aria-pressed={propertyType === ""}
        >
          All
        </button>
        {PROPERTY_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => handleType(type)}
            className={propertyType === type ? "filter-tab is-active" : "filter-tab"}
            aria-pressed={propertyType === type}
          >
            {titleCase(type)}
          </button>
        ))}
      </div>

      <div className="filter-group">
        <label className="filter-label" htmlFor="filter-city">
          City
        </label>
        <input
          id="filter-city"
          type="text"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="e.g. Buea"
        />
      </div>

      <div className="filter-group">
        <label className="filter-label" htmlFor="filter-bedrooms">
          Minimum bedrooms
        </label>
        <select
          id="filter-bedrooms"
          value={minBedrooms}
          onChange={(event) => setMinBedrooms(event.target.value)}
        >
          <option value="">Any</option>
          {[1, 2, 3, 4, 5].map((count) => (
            <option key={count} value={count}>
              {count}+
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <span className="filter-label">Monthly rent (XAF)</span>
        <div className="filter-split">
          <input
            aria-label="Minimum rent"
            type="number"
            min={0}
            value={minRent}
            placeholder="Min"
            onChange={(event) => setMinRent(event.target.value)}
          />
          <input
            aria-label="Maximum rent"
            type="number"
            min={0}
            value={maxRent}
            placeholder="Max"
            onChange={(event) => setMaxRent(event.target.value)}
          />
        </div>
      </div>

      <div className="filter-actions">
        <button type="submit" className="btn btn-block">
          <Search className="h-4 w-4" aria-hidden /> Search properties
        </button>
        <button type="button" onClick={handleClear} className="clear-btn">
          Clear all
        </button>
      </div>
    </form>
  );
}