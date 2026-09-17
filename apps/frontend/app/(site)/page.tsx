// ============================================================
// HOME
// ============================================================
// Public landing: hero + search + the six latest published listings.
// Search just navigates to /properties with query params — the browse
// page is the thing that actually talks to the backend.
//
// The hero text duplicates the RealPress wording you had here ("For rent"
// for i===2 among the badges) on purpose: six real rows now.
// ============================================================

"use client";

import Link from "next/link";
import { MapPin, Search } from "lucide-react";
import FeaturedProperties from "../../components/properties/FeaturedProperties";

export default function HomePage() {
  return (
    <div>
      {/* ---------------- Hero ---------------- */}
      <section className="bg-navy">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-xs uppercase tracking-widest text-paper/60">
            Rent formally · Buea, Cameroon
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl leading-tight text-paper">
            Rent formally. Cameroonian cities, one trusted record at a time.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-paper/70">
            Applications, viewings, and landlord decisions — all on record, so
            moving day has nothing left to argue about.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              const input = new FormData(event.currentTarget).get("city");
              const city = typeof input === "string" ? input.trim() : "";
              window.location.href = city
                ? `/properties?city=${encodeURIComponent(city)}`
                : "/properties";
            }}
            className="mt-8 flex max-w-xl gap-2"
          >
            <label className="flex flex-1 items-center gap-2 bg-paper px-3">
              <MapPin className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden />
              <input
                name="city"
                type="text"
                placeholder="Search by city — e.g. Buea"
                className="w-full bg-transparent py-3 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none"
              />
            </label>
            <button
              type="submit"
              className="inline-flex items-center gap-2 border border-paper bg-paper px-5 py-3 text-sm text-navy hover:bg-paper-dim"
            >
              <Search className="h-4 w-4" aria-hidden /> Search
            </button>
          </form>
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="font-display text-2xl text-ink">How it works</h2>
        <div className="mt-6 grid gap-px border border-line bg-line sm:grid-cols-3">
          {[
            {
              step: "1. Apply",
              body: "Tenants apply against a published listing. One active application per property — re-apply after a decision.",
            },
            {
              step: "2. View",
              body: "Tenants propose times, landlords confirm one. The calendar is checked so a landlord can't be double-booked.",
            },
            {
              step: "3. Decide",
              body: "Landlords move applications under review, then approve or reject. Every step carries a visible status.",
            },
          ].map((item) => (
            <div key={item.step} className="bg-paper px-6 py-6">
              <p className="font-display text-lg text-ink">{item.step}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Latest listings ---------------- */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <FeaturedProperties />
      </section>
    </div>
  );
}