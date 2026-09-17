"use client";

// ============================================================
// REGISTER — POST /api/auth/register
// ============================================================
// The backend takes { email, password } and always creates a TENANT:
// the schema has no name column, and role is set server-side. So this
// page has no name field and no working role selector — a note under the
// landlord button says exactly that instead of pretending.
//
// Registering does NOT log you in (no tokens come back), so success
// sends you to /login.
// ============================================================

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert, UserRoundPlus } from "lucide-react";
import { register } from "../../../api/userApi";
import { Input } from "../../../components/ui/Fields";
import Alert from "../../../components/ui/Alert";

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState<"TENANT" | "LANDLORD">("TENANT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      await register(email.trim(), password);
      router.push("/login");
    } catch (err) {
      // 409 comes back here if the email is already taken.
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper px-6 py-16">
      <div className="mx-auto max-w-md">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-navy font-display text-xs text-navy">
            UR
          </span>
          <span className="font-display text-base text-ink">UrbanRent</span>
        </Link>

        <h1 className="mt-10 font-display text-3xl text-ink">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Already have one?{" "}
          <Link href="/login" className="text-navy underline">
            Log in
          </Link>
        </p>

        <div className="mt-8">
          <p className="text-sm text-ink">I am a</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("TENANT")}
              className={`px-4 py-3 text-left ${
                role === "TENANT"
                  ? "border-2 border-navy bg-paper-dim"
                  : "border border-line hover:border-ink"
              }`}
            >
              <span className="block font-display text-base text-ink">
                Tenant
              </span>
              <span className="text-xs text-ink-soft">Looking for a place</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("LANDLORD")}
              className={`px-4 py-3 text-left ${
                role === "LANDLORD"
                  ? "border-2 border-navy bg-paper-dim"
                  : "border border-line hover:border-ink"
              }`}
            >
              <span className="block font-display text-base text-ink">
                Landlord
              </span>
              <span className="text-xs text-ink-soft">Listing a property</span>
            </button>
          </div>

          {role === "LANDLORD" && (
            <Alert variant="warning">
              <span className="inline-flex items-start gap-2">
                <CircleAlert
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden
                />
                Heads up: landlord sign-up is not wired up on the backend
                yet — every new account is created as a tenant. You can
                register now and have an admin switch you to a landlord
                later.
              </span>
            </Alert>
          )}
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
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
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
          />

          {error && <Alert variant="error">{error}</Alert>}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 bg-navy px-4 py-3 text-sm text-paper hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UserRoundPlus className="h-4 w-4" aria-hidden />
            {pending ? "Creating account…" : "Create account"}
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