// ============================================================
// TERMS & CONDITIONS
// ============================================================

import PageHeader from "../../../components/layout/PageHeader";

export const metadata = { title: "Terms & conditions | UrbanRent" };

const SECTIONS = [
  {
    h: "Using the platform",
    p: "You need an accurate email address to register, and you are responsible for keeping your password private. Accounts are granted either tenant or landlord access; landlord access is issued by an administrator.",
  },
  {
    h: "Listings",
    p: "Landlords are responsible for the accuracy of what they publish — rent, caution fee, location, and property details. A listing is only visible to the public once it is published, and can be unpublished or archived at any time.",
  },
  {
    h: "Applications and viewings",
    p: "Submitting an application does not create a tenancy. A viewing request does not guarantee a viewing until a landlord confirms a specific time. Statuses shown in your account are the authoritative record of where things stand.",
  },
  {
    h: "Rent and caution fees",
    p: "UrbanRent records the rent and caution fee amounts attached to a listing. Payment handling is not part of the platform, so any money changes hands directly between tenant and landlord.",
  },
  {
    h: "Conduct",
    p: "Accounts may be suspended for fraudulent listings, harassment, or attempts to bypass the application and viewing record.",
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <PageHeader
        title="Terms & conditions"
        subtitle="The short version: be accurate, be reachable, and keep it on the record."
      />

      <div className="mt-10 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.h}>
            <h2 className="font-display text-lg text-ink">{section.h}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {section.p}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}