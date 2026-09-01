export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form side */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <a href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-navy text-navy">
              <span className="font-display text-xs">UR</span>
            </span>
            <span className="font-display text-base text-ink">
              UrbanRent
            </span>
          </a>

          <h1 className="mt-10 font-display text-3xl text-ink">
            Log in to your account
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            New here?{" "}
            <a href="/register" className="text-navy underline">
              Create an account
            </a>
          </p>

          <form className="mt-8 space-y-5">
            <label className="block text-sm">
              <span className="text-ink">Email</span>
              <input
                type="email"
                className="mt-1.5 w-full border border-line bg-paper px-3 py-2.5 text-ink placeholder:text-ink-soft/60"
                placeholder="you@example.com"
              />
            </label>

            <label className="block text-sm">
              <span className="text-ink">Password</span>
              <input
                type="password"
                className="mt-1.5 w-full border border-line bg-paper px-3 py-2.5 text-ink"
                placeholder="••••••••"
              />
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-ink-soft">
                <input type="checkbox" className="border-line" />
                Stay logged in
              </label>
              <a href="#" className="text-navy underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full bg-navy px-4 py-3 text-sm text-paper hover:bg-navy-dark"
            >
              Log in
            </button>
          </form>
        </div>
      </div>

      {/* Visual side */}
      <div className="hidden bg-navy lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div />
        <blockquote className="max-w-md">
          <p className="font-display text-2xl leading-snug text-paper">
            "The application and the viewing were both on record. When I
            moved in, there was nothing to argue about."
          </p>
          <cite className="mt-4 block text-sm not-italic text-paper/70">
            — A tenant, Buea
          </cite>
        </blockquote>
        <p className="text-xs text-paper/50">UrbanRent — Buea, Cameroon</p>
      </div>
    </div>
  );
}
