export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-paper px-6 py-16">
      <div className="mx-auto max-w-md">
        <a href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-navy text-navy">
            <span className="font-display text-xs">UR</span>
          </span>
          <span className="font-display text-base text-ink">UrbanRent</span>
        </a>

        <h1 className="mt-10 font-display text-3xl text-ink">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Already have one?{" "}
          <a href="/login" className="text-navy underline">
            Log in
          </a>
        </p>

        {/* Role selector */}
        <div className="mt-8">
          <p className="text-sm text-ink">I am a</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="border-2 border-navy bg-paper-dim px-4 py-3 text-left"
            >
              <span className="block font-display text-base text-ink">
                Tenant
              </span>
              <span className="text-xs text-ink-soft">
                Looking for a place
              </span>
            </button>
            <button
              type="button"
              className="border border-line px-4 py-3 text-left hover:border-ink"
            >
              <span className="block font-display text-base text-ink">
                Landlord
              </span>
              <span className="text-xs text-ink-soft">
                Listing a property
              </span>
            </button>
          </div>
        </div>

        <form className="mt-6 space-y-5">
          <label className="block text-sm">
            <span className="text-ink">Full name</span>
            <input
              type="text"
              className="mt-1.5 w-full border border-line bg-paper px-3 py-2.5 text-ink"
              placeholder="Njikang Bright"
            />
          </label>

          <label className="block text-sm">
            <span className="text-ink">Email</span>
            <input
              type="email"
              className="mt-1.5 w-full border border-line bg-paper px-3 py-2.5 text-ink"
              placeholder="you@example.com"
            />
          </label>

          <label className="block text-sm">
            <span className="text-ink">Password</span>
            <input
              type="password"
              className="mt-1.5 w-full border border-line bg-paper px-3 py-2.5 text-ink"
              placeholder="At least 8 characters"
            />
          </label>

          <button
            type="submit"
            className="w-full bg-navy px-4 py-3 text-sm text-paper hover:bg-navy-dark"
          >
            Create account
          </button>

          <p className="text-xs leading-relaxed text-ink-soft">
            By creating an account you agree to UrbanRent's terms and confirm
            the information above is accurate.
          </p>
        </form>
      </div>
    </div>
  );
}
