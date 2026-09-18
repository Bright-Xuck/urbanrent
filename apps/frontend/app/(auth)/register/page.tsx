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
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="mark">UR</span>
          <span className="font-display text-lg text-ink">UrbanRent</span>
        </div>

        <h1>Create your account</h1>
        <p className="muted">
          Already have one?{" "}
          <Link href="/login" className="link">
            Log in
          </Link>
        </p>

        <div className="mt-6">
          <p>I am a</p>
          <div className="role-picker mt-2">
            <button
              type="button"
              onClick={() => setRole("TENANT")}
              className={role === "TENANT" ? "role-option is-active" : "role-option"}
            >
              <strong>Tenant</strong>
              <span>Looking for a place</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("LANDLORD")}
              className={role === "LANDLORD" ? "role-option is-active" : "role-option"}
            >
              <strong>Landlord</strong>
              <span>Listing a property</span>
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

        <form className="mt-6" onSubmit={handleSubmit}>
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

          <button type="submit" disabled={pending} className="btn btn-block">
            <UserRoundPlus className="h-4 w-4" aria-hidden />
            {pending ? "Creating account…" : "Create account"}
          </button>

          <p className="mt-4 text-xs leading-relaxed text-ink-soft">
            By creating an account you agree to UrbanRent's terms and confirm
            the information above is accurate.
          </p>
        </form>
      </div>
    </div>
  );
}