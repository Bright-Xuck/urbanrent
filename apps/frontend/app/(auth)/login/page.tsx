"use client";

// ============================================================
// LOGIN — POST /api/auth/login
// ============================================================
// Sends { email, password }. On success the backend sets an httpOnly
// refresh cookie AND returns { user, accessToken } — the cookie keeps
// working after a reload, the access token lives in the store only.
// Tenants land on /applications, everyone else on /dashboard.
// ============================================================

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { login } from "../../../api/userApi";
import { useAuthStore } from "../../../Store/useUserStore";
import { Input } from "../../../components/ui/Fields";
import Alert from "../../../components/ui/Alert";

export default function LoginPage() {
  const router = useRouter();
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
      const { user, accessToken } = await login(email.trim(), password);
      setSession(user, accessToken);
      router.push(user.role === "TENANT" ? "/applications" : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-navy font-display text-xs text-navy">
              UR
            </span>
            <span className="font-display text-base text-ink">UrbanRent</span>
          </Link>

          <h1 className="mt-10 font-display text-3xl text-ink">
            Log in to your account
          </h1>
          <p className="mt-2 text-sm text-ink-soft">
            New here?{" "}
            <Link href="/register" className="text-navy underline">
              Create an account
            </Link>
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />

            <Input
              label="Password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />

            {error && <Alert variant="error">{error}</Alert>}

            <button
              type="submit"
              disabled={pending}
              className="inline-flex w-full items-center justify-center gap-2 bg-navy px-4 py-3 text-sm text-paper hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              {pending ? "Logging in…" : "Log in"}
            </button>
          </form>
        </div>
      </div>

      <div className="hidden bg-navy lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div />
        <blockquote className="max-w-md">
          <p className="font-display text-2xl leading-snug text-paper">
            “The application and the viewing were both on record. When I
            moved in, there was nothing to argue about.”
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