// ============================================================
// HOME
// ============================================================
// Public landing page, laid out like the demo home: a hero with a search
// bar, a centred "how it works" strip, then the featured listings grid.
//
// Search only navigates to /properties with query params — the listing
// page is what actually talks to the backend. Every field here maps to a
// filter GET /api/properties understands, which is also why the listing
// page seeds its filter card from these same params.
// ============================================================

"use client";

import { CalendarCheck2, FileCheck2, Search, ShieldCheck } from "lucide-react";
import { PROPERTY_TYPES } from "../../components/properties/PropertyFilters";
import { titleCase } from "../../lib/format";
import FeaturedProperties from "../../components/properties/FeaturedProperties";

// The three steps shown in the "how it works" strip.
const STEPS = [
  {
    icon: FileCheck2,
    title: "1. Apply",
    body: "Tenants apply against a published listing. One active application per property — and you can re-apply after a decision.",
  },
  {
    icon: CalendarCheck2,
    title: "2. View",
    body: "Tenants propose times, landlords confirm one. The calendar is checked so a landlord can't be double-booked.",
  },
  {
    icon: ShieldCheck,
    title: "3. Decide",
    body: "Landlords move applications under review, then approve or reject. Every step carries a visible status.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* ---------------- Hero ---------------- */}
      <section className="hero">
        <div className="rp-container">
          <p className="hero-eyebrow">Rent formally · Buea, Cameroon</p>
          <h1>Find your next home faster, with everything on record.</h1>
          <p>
            Applications, viewings and landlord decisions — all on record, so
            moving day has nothing left to argue about.
          </p>

          <form
            role="search"
            onSubmit={(event) => {
              event.preventDefault();

              const data = new FormData(event.currentTarget);
              const params = new URLSearchParams();

              // Only the fields that were filled in travel in the URL, so
              // an empty search behaves exactly like /properties.
              for (const key of ["city", "propertyType", "minBedrooms", "maxRent"]) {
                const value = data.get(key);
                if (typeof value === "string" && value.trim() !== "") {
                  params.set(key, value.trim());
                }
              }

              const query = params.toString();
              window.location.href = query ? `/properties?${query}` : "/properties";
            }}
            className="search-box"
          >
            <label className="search-field">
              <span>City</span>
              <input name="city" type="text" placeholder="e.g. Buea" />
            </label>

            <label className="search-field">
              <span>Property type</span>
              <select name="propertyType" defaultValue="">
                <option value="">Any type</option>
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {titleCase(type)}
                  </option>
                ))}
              </select>
            </label>

            <label className="search-field">
              <span>Bedrooms</span>
              <select name="minBedrooms" defaultValue="">
                <option value="">Any</option>
                {[1, 2, 3, 4, 5].map((count) => (
                  <option key={count} value={count}>
                    {count}+
                  </option>
                ))}
              </select>
            </label>

            <label className="search-field">
              <span>Max rent (XAF)</span>
              <input name="maxRent" type="number" min={0} placeholder="e.g. 150000" />
            </label>

            <button type="submit" className="search-submit">
              <Search className="h-4 w-4" aria-hidden /> Search
            </button>
          </form>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="rp-section">
        <div className="rp-container">
          <div className="section-head">
            <span className="eyebrow">How it works</span>
            <h2>Everything you need, in one platform</h2>
            <p>
              Apply, view, decide — one record runs from the first application
              to the day you move in.
            </p>
          </div>

          <div className="feature-grid">
            {STEPS.map((step) => {
              const Icon = step.icon;

              return (
                <div key={step.title} className="feature-card">
                  <span className="feature-icon">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- Featured listings ---------------- */}
      <section className="rp-section bg-paper-dim">
        <div className="rp-container">
          <FeaturedProperties />
        </div>
      </section>
    </div>
  );
}