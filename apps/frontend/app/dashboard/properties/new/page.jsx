import Navbar from "../../../../components/Navbar";
import Footer from "../../../../components/Footer";

const AMENITIES = [
  "Private parking",
  "External kitchen",
  "Water tank",
  "3-phase power",
  "Wi-Fi ready",
  "Fenced compound",
  "Generator",
  "Furnished",
];

export default function NewPropertyPage() {
  return (
    <div className="min-h-screen bg-paper">
      <Navbar authed role="landlord" />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <a
          href="/dashboard"
          className="text-sm text-ink-soft hover:text-ink"
        >
          ← Back to my properties
        </a>
        <h1 className="mt-4 font-display text-3xl text-ink">
          List a new property
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Saved as a draft until you publish it.
        </p>

        <form className="mt-10 space-y-10">
          <section>
            <h2 className="font-display text-lg text-ink">Basic details</h2>
            <div className="mt-4 space-y-5">
              <label className="block text-sm">
                <span className="text-ink">Title</span>
                <input
                  type="text"
                  placeholder="e.g. 2-bedroom apartment, Molyko"
                  className="mt-1.5 w-full border border-line bg-paper px-3 py-2.5 text-ink placeholder:text-ink-soft/60"
                />
              </label>

              <label className="block text-sm">
                <span className="text-ink">Description</span>
                <textarea
                  rows={4}
                  placeholder="Describe the property, its condition, and what's nearby."
                  className="mt-1.5 w-full border border-line bg-paper px-3 py-2.5 text-ink placeholder:text-ink-soft/60"
                />
              </label>

              <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                <label className="block text-sm">
                  <span className="text-ink">Type</span>
                  <select className="mt-1.5 w-full border border-line bg-paper px-3 py-2.5 text-ink">
                    <option>Apartment</option>
                    <option>Studio</option>
                    <option>House</option>
                    <option>Villa</option>
                    <option>Commercial</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="text-ink">Bedrooms</span>
                  <input
                    type="number"
                    className="mt-1.5 w-full border border-line bg-paper px-3 py-2.5 text-ink"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ink">Bathrooms</span>
                  <input
                    type="number"
                    className="mt-1.5 w-full border border-line bg-paper px-3 py-2.5 text-ink"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-ink">Size (m²)</span>
                  <input
                    type="number"
                    className="mt-1.5 w-full border border-line bg-paper px-3 py-2.5 text-ink"
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="border-t border-line pt-8">
            <h2 className="font-display text-lg text-ink">Location</h2>
            <div className="mt-4 grid grid-cols-2 gap-5">
              <label className="block text-sm">
                <span className="text-ink">City</span>
                <select className="mt-1.5 w-full border border-line bg-paper px-3 py-2.5 text-ink">
                  <option>Buea</option>
                  <option>Douala</option>
                  <option>Yaoundé</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-ink">Neighborhood</span>
                <input
                  type="text"
                  placeholder="e.g. Molyko"
                  className="mt-1.5 w-full border border-line bg-paper px-3 py-2.5 text-ink placeholder:text-ink-soft/60"
                />
              </label>
              <label className="col-span-2 block text-sm">
                <span className="text-ink">Address</span>
                <input
                  type="text"
                  className="mt-1.5 w-full border border-line bg-paper px-3 py-2.5 text-ink"
                />
              </label>
            </div>
          </section>

          <section className="border-t border-line pt-8">
            <h2 className="font-display text-lg text-ink">Pricing</h2>
            <div className="mt-4 grid grid-cols-2 gap-5">
              <label className="block text-sm">
                <span className="text-ink">Monthly rent (XAF)</span>
                <input
                  type="number"
                  className="mt-1.5 w-full border border-line bg-paper px-3 py-2.5 text-ink"
                />
              </label>
              <label className="block text-sm">
                <span className="text-ink">Caution fee (XAF)</span>
                <input
                  type="number"
                  placeholder="Optional"
                  className="mt-1.5 w-full border border-line bg-paper px-3 py-2.5 text-ink placeholder:text-ink-soft/60"
                />
              </label>
            </div>
          </section>

          <section className="border-t border-line pt-8">
            <h2 className="font-display text-lg text-ink">Amenities</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {AMENITIES.map((amenity) => (
                <label
                  key={amenity}
                  className="flex items-center gap-2 text-sm text-ink"
                >
                  <input type="checkbox" className="border-line" />
                  {amenity}
                </label>
              ))}
            </div>
          </section>

          <section className="border-t border-line pt-8">
            <h2 className="font-display text-lg text-ink">Photos</h2>
            <div className="mt-4 flex aspect-[16/6] items-center justify-center border border-dashed border-line text-sm text-ink-soft">
              Drag photos here, or click to upload
            </div>
          </section>

          <div className="flex items-center gap-3 border-t border-line pt-8">
            <button
              type="submit"
              className="border border-navy bg-navy px-5 py-2.5 text-sm text-paper hover:bg-navy-dark"
            >
              Save as draft
            </button>
            <button
              type="submit"
              className="border border-line px-5 py-2.5 text-sm text-ink hover:border-ink"
            >
              Publish listing
            </button>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
}
