export default function Footer() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-navy text-navy">
                <span className="font-display text-xs">UR</span>
              </span>
              <span className="font-display text-base text-ink">
                UrbanRent
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-ink-soft">
              A formal record for every rental, so tenants and landlords
              agree on what was actually promised.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-ink">For tenants</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li>
                <a href="/" className="hover:text-ink">
                  Browse listings
                </a>
              </li>
              <li>
                <a href="/applications" className="hover:text-ink">
                  Track an application
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-ink">For landlords</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li>
                <a href="/dashboard" className="hover:text-ink">
                  List a property
                </a>
              </li>
              <li>
                <a href="/viewings" className="hover:text-ink">
                  Manage viewings
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <p>UrbanRent — Buea, Cameroon</p>
          <p>Rent-only. No agents in the loop.</p>
        </div>
      </div>
    </footer>
  );
}
