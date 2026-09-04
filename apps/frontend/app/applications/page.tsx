import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import StatusBadge from "../../components/StatusBadge";

const APPLICATIONS = [
  {
    property: "2-bedroom apartment, Molyko",
    counterpart: "Tenant: Etta Cubertson",
    submitted: "3 Aug 2026",
    status: "under_review",
  },
  {
    property: "3-bedroom house, Great Soppo",
    counterpart: "Tenant: Ako Junior",
    submitted: "29 Jul 2026",
    status: "submitted",
  },
  {
    property: "Self-contained studio, Bonduma",
    counterpart: "Tenant: Suinyuy Mathias",
    submitted: "14 Jul 2026",
    status: "approved",
  },
  {
    property: "1-bedroom flat, Great Soppo",
    counterpart: "Tenant: Frederic Ayuk",
    submitted: "2 Jul 2026",
    status: "rejected",
  },
];

export default function ApplicationsPage() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar authed role="landlord" />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-display text-3xl text-ink">Applications</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Every application received across your properties, in one record.
        </p>

        {/* Filter tabs */}
        <div className="mt-8 flex gap-6 border-b border-line text-sm">
          <button className="border-b-2 border-navy pb-3 text-ink">
            All
          </button>
          <button className="pb-3 text-ink-soft hover:text-ink">
            Submitted
          </button>
          <button className="pb-3 text-ink-soft hover:text-ink">
            Under review
          </button>
          <button className="pb-3 text-ink-soft hover:text-ink">
            Approved
          </button>
          <button className="pb-3 text-ink-soft hover:text-ink">
            Closed
          </button>
        </div>

        <div className="mt-2">
          {APPLICATIONS.map((app, i) => (
            <div
              key={app.property + i}
              className="flex flex-wrap items-center gap-4 border-b border-line py-5"
            >
              <span className="w-8 shrink-0 font-display text-sm text-ink-soft">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-[14rem] flex-1">
                <p className="font-display text-base text-ink">
                  {app.property}
                </p>
                <p className="text-sm text-ink-soft">{app.counterpart}</p>
              </div>
              <p className="w-32 text-sm text-ink-soft">{app.submitted}</p>
              <StatusBadge status={app.status} />
              <a
                href="#"
                className="ml-auto text-sm text-navy underline sm:ml-0"
              >
                Review
              </a>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
