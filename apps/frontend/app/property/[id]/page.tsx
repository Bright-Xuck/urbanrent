import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import StatusBadge from "../../../components/StatusBadge";

const AMENITIES = [
  "Private parking",
  "External kitchen",
  "Water tank",
  "3-phase power",
  "Wi-Fi ready",
  "Fenced compound",
];

export default function PropertyDetailPage() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar authed={false} />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <a href="/" className="text-sm text-ink-soft hover:text-ink">
          ← Back to listings
        </a>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl text-ink">
                2-bedroom apartment, Molyko
              </h1>
              <StatusBadge status="published" />
            </div>
            <p className="mt-1 text-ink-soft">Molyko, Buea</p>
          </div>
          <p className="font-display text-2xl text-ink">
            75,000 XAF{" "}
            <span className="text-sm font-sans text-ink-soft">/ month</span>
          </p>
        </div>

        {/* Gallery */}
        <div className="mt-8 grid grid-cols-4 grid-rows-2 gap-2">
          <div className="col-span-4 row-span-2 flex aspect-[16/9] items-center justify-center bg-paper-dim text-sm text-ink-soft sm:col-span-2 sm:row-span-2 sm:aspect-auto">
            Photo 1 of 6
          </div>
          <div className="flex aspect-square items-center justify-center bg-paper-dim text-xs text-ink-soft">
            Photo 2
          </div>
          <div className="flex aspect-square items-center justify-center bg-paper-dim text-xs text-ink-soft">
            Photo 3
          </div>
          <div className="flex aspect-square items-center justify-center bg-paper-dim text-xs text-ink-soft">
            Photo 4
          </div>
          <div className="relative flex aspect-square items-center justify-center bg-paper-dim text-xs text-ink-soft">
            Photo 5
            <span className="absolute inset-0 flex items-center justify-center bg-ink/50 text-sm text-paper">
              +2 more
            </span>
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          {/* Main column */}
          <div className="lg:col-span-2">
            <section className="border-b border-line pb-8">
              <h2 className="font-display text-xl text-ink">Overview</h2>
              <dl className="mt-4 grid grid-cols-2 gap-y-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-ink-soft">Bedrooms</dt>
                  <dd className="text-ink">2</dd>
                </div>
                <div>
                  <dt className="text-ink-soft">Bathrooms</dt>
                  <dd className="text-ink">1</dd>
                </div>
                <div>
                  <dt className="text-ink-soft">Size</dt>
                  <dd className="text-ink">85 m²</dd>
                </div>
                <div>
                  <dt className="text-ink-soft">Type</dt>
                  <dd className="text-ink">Apartment</dd>
                </div>
              </dl>
            </section>

            <section className="border-b border-line py-8">
              <h2 className="font-display text-xl text-ink">Description</h2>
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                A quiet 2-bedroom apartment just off the main Molyko road,
                five minutes' walk from the university. Fenced compound with
                dedicated parking, a separate external kitchen, and a
                standing water tank for the dry season. Recently repainted,
                available for immediate move-in.
              </p>
            </section>

            <section className="border-b border-line py-8">
              <h2 className="font-display text-xl text-ink">Amenities</h2>
              <ul className="mt-4 grid grid-cols-2 gap-y-3 text-sm text-ink sm:grid-cols-3">
                {AMENITIES.map((amenity) => (
                  <li key={amenity} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-navy" />
                    {amenity}
                  </li>
                ))}
              </ul>
            </section>

            <section className="py-8">
              <h2 className="font-display text-xl text-ink">Location</h2>
              <div className="mt-4 flex aspect-[16/6] items-center justify-center bg-paper-dim text-sm text-ink-soft">
                Map placeholder — Molyko, Buea
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-8 border border-line p-6">
              <p className="text-sm text-ink-soft">Listed by</p>
              <p className="mt-1 font-display text-lg text-ink">
                Kelsey Njock
              </p>
              <p className="text-sm text-ink-soft">Landlord · Verified</p>

              <dl className="mt-6 space-y-3 border-t border-line pt-6 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Monthly rent</dt>
                  <dd className="text-ink">75,000 XAF</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Caution fee</dt>
                  <dd className="text-ink">150,000 XAF</dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-col gap-3">
                <button className="w-full border border-navy bg-navy px-4 py-3 text-sm text-paper hover:bg-navy-dark">
                  Request a viewing
                </button>
                <button className="w-full border border-line px-4 py-3 text-sm text-ink hover:border-ink">
                  Apply to rent
                </button>
              </div>
              <p className="mt-4 text-xs text-ink-soft">
                You'll need an account to request a viewing or apply.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}
