export default function Navbar({ authed = false, role = "guest" }) {
  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-navy text-navy">
            <span className="font-display text-sm">UR</span>
          </span>
          <span className="font-display text-lg text-ink">UrbanRent</span>
        </a>

        <nav className="hidden items-center gap-8 text-sm text-ink-soft md:flex">
          <a href="/" className="hover:text-ink">
            Browse
          </a>
          {role === "landlord" && (
            <>
              <a href="/dashboard" className="hover:text-ink">
                My properties
              </a>
              <a href="/applications" className="hover:text-ink">
                Applications
              </a>
              <a href="/viewings" className="hover:text-ink">
                Viewings
              </a>
            </>
          )}
          {role === "tenant" && (
            <>
              <a href="/applications" className="hover:text-ink">
                My applications
              </a>
              <a href="/viewings" className="hover:text-ink">
                My viewings
              </a>
            </>
          )}
        </nav>

        {authed ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ink-soft sm:inline">
              Njikang Bright
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm text-paper">
              NB
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="text-sm text-ink-soft hover:text-ink"
            >
              Log in
            </a>
            <a
              href="/register"
              className="rounded-sm bg-navy px-4 py-2 text-sm text-paper hover:bg-navy-dark"
            >
              Create account
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
