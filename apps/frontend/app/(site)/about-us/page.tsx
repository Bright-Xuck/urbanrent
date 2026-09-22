// ============================================================
// ABOUT US
// ============================================================

import PageHeader from "../../../components/layout/PageHeader";

export const metadata = { title: "About us | UrbanRent" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <PageHeader
        title="About UrbanRent"
        subtitle="Rent-only. No agents in the loop."
      />

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink-soft">
        <section>
          <h2 className="font-display text-xl text-ink">Why this exists</h2>
          <p className="mt-3">
            Renting in Cameroon usually runs on memory and goodwill: a tenant
            pays a caution fee, agrees a rent verbally, and months later nobody
            can say what was actually promised. UrbanRent puts that
            conversation on record. Every application carries a status, every
            viewing carries a confirmed time, and both sides can see the same
            history.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">How a rental flows</h2>
          <ol className="mt-3 space-y-3">
            <li>
              <span className="text-ink">1. A landlord lists a property.</span>{" "}
              It starts as a draft and only becomes visible once it is
              published.
            </li>
            <li>
              <span className="text-ink">2. A tenant applies.</span> One active
              application per property at a time; if it is rejected or
              withdrawn, the tenant can reapply later.
            </li>
            <li>
              <span className="text-ink">3. A viewing is arranged.</span> The
              tenant proposes times, the landlord confirms one. The platform
              refuses to double-book the same landlord.
            </li>
            <li>
              <span className="text-ink">4. A decision is recorded.</span> The
              landlord approves or rejects, and the application closes with a
              status nobody has to remember.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-xl text-ink">What we deliberately don't do</h2>
          <p className="mt-3">
            No agent role, no listings for sale, no payment handling yet. The
            focus is the record — applications and viewings — because that is
            where disputes actually come from.
          </p>
        </section>
      </div>
    </div>
  );
}