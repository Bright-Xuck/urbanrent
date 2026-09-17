"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { login } from "../../api/userApi";
import { useAuthStore } from "../../Store/useUserStore";

export default function LoginPage() {
  const router = useRouter();

  // The store's session setter. Renamed locally so it can't be confused
  // with the `login` API call imported above.
  const setSession = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      // POST /api/auth/login → { message, user, accessToken }.
      // The refresh token arrives as an httpOnly cookie, so there's no
      // second thing to store on the client.
      const { user, accessToken } = await login(email, password);

      setSession(user, accessToken);

      // Landlords own listings; tenants mostly track applications.
      router.push(user.role === "TENANT" ? "/applications" : "/dashboard");
    } catch (err) {
      // Our API functions throw a plain Error whose message came from the
      // backend, so we can simply show it.
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

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

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block text-sm">
              <span className="text-ink">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 w-full border border-line bg-paper px-3 py-2.5 text-ink placeholder:text-ink-soft/60"
                placeholder="you@example.com"
              />
            </label>

            <label className="block text-sm">
              <span className="text-ink">Password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 w-full border border-line bg-paper px-3 py-2.5 text-ink"
                placeholder="••••••••"
              />
            </label>

            <div className="flex items-center justify-between text-sm">
              {/* Decorative for now: the backend always issues a 7-day
                  refresh cookie, so there's no shorter session to ask for. */}
              <label className="flex items-center gap-2 text-ink-soft">
                <input type="checkbox" className="border-line" />
                Stay logged in
              </label>
              <a href="#" className="text-navy underline">
                Forgot password?
              </a>
            </div>

            {/* Server-side failures surface here. */}
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full bg-navy px-4 py-3 text-sm text-paper hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Logging in…" : "Log in"}
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
