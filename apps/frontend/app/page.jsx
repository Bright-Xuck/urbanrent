import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PropertyCard from "../components/PropertyCard";

const LISTINGS = [
  {
    title: "2-bedroom apartment, Molyko",
    city: "Buea",
    neighborhood: "Molyko",
    bedrooms: 2,
    bathrooms: 1,
    monthlyRent: 75000,
    status: "published",
  },
  {
    title: "Self-contained studio, Bonapriso",
    city: "Douala",
    neighborhood: "Bonapriso",
    bedrooms: 1,
    bathrooms: 1,
    monthlyRent: 60000,
    status: "published",
  },
  {
    title: "3-bedroom family house, Bastos",
    city: "Yaoundé",
    neighborhood: "Bastos",
    bedrooms: 3,
    bathrooms: 2,
    monthlyRent: 180000,
    status: "published",
  },
  {
    title: "1-bedroom flat, Great Soppo",
    city: "Buea",
    neighborhood: "Great Soppo",
    bedrooms: 1,
    bathrooms: 1,
    monthlyRent: 45000,
    status: "published",
  },
  {
    title: "4-bedroom duplex, Bonanjo",
    city: "Douala",
    neighborhood: "Bonanjo",
    bedrooms: 4,
    bathrooms: 3,
    monthlyRent: 260000,
    status: "published",
  },
];

export default function BrowsePage() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar authed={false} />

      {/* Hero */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <p className="text-sm text-ink-soft">Buea · Douala · Yaoundé</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl leading-tight text-ink sm:text-5xl">
            Every rental here has a record. Not just a promise.
          </h1>
          <p className="mt-4 max-w-lg text-ink-soft">
            Browse verified listings, request a viewing, and apply directly —
            no agent, no word of mouth, no surprises when it's time to move
            in.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-line bg-paper-dim">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <form className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-ink-soft">City</span>
              <select className="min-w-[10rem] border border-line bg-paper px-3 py-2 text-ink">
                <option>Any city</option>
                <option>Buea</option>
                <option>Douala</option>
                <option>Yaoundé</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-ink-soft">Bedrooms</span>
              <select className="min-w-[8rem] border border-line bg-paper px-3 py-2 text-ink">
                <option>Any</option>
                <option>1+</option>
                <option>2+</option>
                <option>3+</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-ink-soft">Max rent (XAF)</span>
              <input
                type="text"
                placeholder="No limit"
                className="w-40 border border-line bg-paper px-3 py-2 text-ink placeholder:text-ink-soft/60"
              />
            </label>
            <button
              type="submit"
              className="border border-navy bg-navy px-5 py-2 text-sm text-paper hover:bg-navy-dark"
            >
              Apply filters
            </button>
          </form>
        </div>
      </section>

      {/* Listings */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-display text-xl text-ink">
            {LISTINGS.length} listings
          </h2>
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            Sort by
            <select className="border border-line bg-paper px-2 py-1 text-ink">
              <option>Newest</option>
              <option>Price: low to high</option>
              <option>Price: high to low</option>
            </select>
          </label>
        </div>

        <div>
          {LISTINGS.map((listing, i) => (
            <PropertyCard key={listing.title} index={i + 1} {...listing} />
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-10 flex items-center justify-between border-t border-line pt-6 text-sm">
          <p className="text-ink-soft">Page 1 of 4</p>
          <div className="flex gap-2">
            <button
              disabled
              className="border border-line px-3 py-1.5 text-ink-soft/50"
            >
              Previous
            </button>
            <button className="border border-navy px-3 py-1.5 text-navy hover:bg-navy hover:text-paper">
              Next
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
