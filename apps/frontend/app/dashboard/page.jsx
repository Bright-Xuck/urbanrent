import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import StatusBadge from "../../components/StatusBadge";

const MY_PROPERTIES = [
  {
    title: "2-bedroom apartment, Molyko",
    city: "Buea",
    status: "published",
    rent: 75000,
    applications: 4,
    viewings: 2,
  },
  {
    title: "Self-contained studio, Bonduma",
    city: "Buea",
    status: "draft",
    rent: 50000,
    applications: 0,
    viewings: 0,
  },
  {
    title: "3-bedroom house, Great Soppo",
    city: "Buea",
    status: "unpublished",
    rent: 130000,
    applications: 1,
    viewings: 0,
  },
];

export default function LandlordDashboard() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar authed role="landlord" />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-ink">My properties</h1>
            <p className="mt-1 text-sm text-ink-soft">
              Manage your listings, drafts, and archived properties.
            </p>
          </div>
          <a
            href="/dashboard/properties/new"
            className="border border-navy bg-navy px-5 py-2.5 text-sm text-paper hover:bg-navy-dark"
          >
            List a new property
          </a>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
          <div className="bg-paper px-6 py-5">
            <p className="text-xs text-ink-soft">Listings</p>
            <p className="mt-1 font-display text-2xl text-ink">3</p>
          </div>
          <div className="bg-paper px-6 py-5">
            <p className="text-xs text-ink-soft">Published</p>
            <p className="mt-1 font-display text-2xl text-ink">1</p>
          </div>
          <div className="bg-paper px-6 py-5">
            <p className="text-xs text-ink-soft">Open applications</p>
            <p className="mt-1 font-display text-2xl text-ink">5</p>
          </div>
          <div className="bg-paper px-6 py-5">
            <p className="text-xs text-ink-soft">Pending viewings</p>
            <p className="mt-1 font-display text-2xl text-ink">2</p>
          </div>
        </div>

        {/* Table */}
        <div className="mt-10">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-line pb-3 text-xs text-ink-soft">
            <span>Property</span>
            <span>Status</span>
            <span>Rent</span>
            <span>Activity</span>
            <span></span>
          </div>

          {MY_PROPERTIES.map((p) => (
            <div
              key={p.title}
              className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 border-b border-line py-5"
            >
              <div>
                <p className="font-display text-base text-ink">{p.title}</p>
                <p className="text-sm text-ink-soft">{p.city}</p>
              </div>
              <StatusBadge status={p.status} />
              <p className="text-sm text-ink">
                {p.rent.toLocaleString()} XAF
              </p>
              <p className="text-sm text-ink-soft">
                {p.applications} applications · {p.viewings} viewings
              </p>
              <div className="flex items-center gap-4 text-sm">
                <a href="#" className="text-navy underline">
                  Edit
                </a>
                <a href="#" className="text-danger underline">
                  Archive
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
