import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import StatusBadge from "../../components/StatusBadge";

const VIEWINGS = [
  {
    property: "2-bedroom apartment, Molyko",
    counterpart: "Tenant: Etta Cubertson",
    proposed: "Sat 6 Sep, 10:00 or Sun 7 Sep, 14:00",
    status: "requested",
  },
  {
    property: "3-bedroom house, Great Soppo",
    counterpart: "Tenant: Ako Junior",
    proposed: "Confirmed for Fri 5 Sep, 16:00",
    status: "confirmed",
  },
  {
    property: "Self-contained studio, Bonduma",
    counterpart: "Tenant: Suinyuy Mathias",
    proposed: "Was Wed 3 Sep, 09:00",
    status: "completed",
  },
];

export default function ViewingsPage() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar authed role="landlord" />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-display text-3xl text-ink">Viewing requests</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Confirm a time once, and it's locked in — no double-booked slots.
        </p>

        <div className="mt-8">
          {VIEWINGS.map((v, i) => (
            <div
              key={v.property + i}
              className="border-b border-line py-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-base text-ink">
                    {v.property}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {v.counterpart}
                  </p>
                </div>
                <StatusBadge status={v.status} />
              </div>

              <p className="mt-3 text-sm text-ink">{v.proposed}</p>

              {v.status === "requested" && (
                <div className="mt-4 flex gap-3">
                  <button className="border border-navy bg-navy px-4 py-2 text-sm text-paper hover:bg-navy-dark">
                    Confirm Sat 6 Sep, 10:00
                  </button>
                  <button className="border border-line px-4 py-2 text-sm text-ink hover:border-ink">
                    Propose another time
                  </button>
                  <button className="text-sm text-danger underline">
                    Decline
                  </button>
                </div>
              )}

              {v.status === "confirmed" && (
                <div className="mt-4 flex gap-3">
                  <button className="border border-line px-4 py-2 text-sm text-ink hover:border-ink">
                    Mark as completed
                  </button>
                  <button className="text-sm text-danger underline">
                    Mark as no-show
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
