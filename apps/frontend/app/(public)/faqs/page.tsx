// ============================================================
// FAQs
// ============================================================

import PageHeader from "../../../components/layout/PageHeader";

export const metadata = { title: "FAQs | UrbanRent" };

const FAQS = [
  {
    q: "Do I need an account to browse?",
    a: "No. Browsing published listings is public. You need to be signed in to apply for a property or request a viewing.",
  },
  {
    q: "Can I apply for more than one property?",
    a: "Yes. The limit is one ACTIVE application per property — so you can't have two open applications on the same listing, but you can apply to as many different properties as you like.",
  },
  {
    q: "What happens if my application is rejected?",
    a: "It closes with a REJECTED status. Because we don't lock a property-and-tenant pair permanently, you can reapply on the same property later if it is still published.",
  },
  {
    q: "Who confirms a viewing time?",
    a: "You propose times; the landlord confirms one of them. If the landlord already has a viewing booked around that time, the platform refuses the clash rather than double-booking them.",
  },
  {
    q: "What is a caution fee?",
    a: "It's the local term for what is often called a security deposit. It is listed separately from monthly rent, and a fee of zero means none was specified.",
  },
  {
    q: "Can I sign up as a landlord?",
    a: "Sign-up currently creates tenant accounts only. Landlord access is granted by an administrator after your account exists.",
  },
];

export default function FaqsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <PageHeader
        title="Frequently asked questions"
        subtitle="The things people ask before their first application."
      />

      <div className="mt-10 border-t border-line">
        {FAQS.map((item) => (
          <section key={item.q} className="border-b border-line py-6">
            <h2 className="font-display text-lg text-ink">{item.q}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {item.a}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}