"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRoundPlus } from "lucide-react";
import { register } from "../../../api/userApi";
import type { RegistrationRole } from "../../../api/types";
import { Input } from "../../../components/ui/Fields";
import Alert from "../../../components/ui/Alert";

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState<RegistrationRole>("TENANT");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    if (typeof email !== "string" || typeof password !== "string") {
      setError("Enter your email and password.");
      return;
    }

    setPending(true);
    try {
      await register(email.trim(), password, role);
      router.push("/login");
    } catch (err) {
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

        <fieldset className="mt-6 border-0 p-0">
          <legend>I am a</legend>
          <div className="role-picker mt-2">
            <button
              type="button"
              onClick={() => setRole("TENANT")}
              className={
                role === "TENANT" ? "role-option is-active" : "role-option"
              }
              aria-pressed={role === "TENANT"}
            >
              <strong>Tenant</strong>
              <span>Looking for a place</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("LANDLORD")}
              className={
                role === "LANDLORD" ? "role-option is-active" : "role-option"
              }
              aria-pressed={role === "LANDLORD"}
            >
              <strong>Landlord</strong>
              <span>Listing a property</span>
            </button>
          </div>
        </fieldset>

        <form className="mt-6" onSubmit={handleSubmit}>
          <Input
            name="email"
            label="Email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />

          <Input
            name="password"
            label="Password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            placeholder="At least 8 characters"
          />

          {error && <Alert variant="error">{error}</Alert>}

          <button type="submit" disabled={pending} className="btn btn-block">
            <UserRoundPlus className="h-4 w-4" aria-hidden />
            {pending ? "Creating account…" : "Create account"}
          </button>

          <p className="mt-4 text-xs leading-relaxed text-ink-soft">
            By creating an account you agree to UrbanRent&apos;s terms and confirm
            the information above is accurate.
          </p>
        </form>
      </div>
    </div>
  );
}