"use client";

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
      const { user, accessToken } = await login(email.trim(), password);
      setSession(user, accessToken);
      const roleHome = {
        TENANT: "/tenant",
        LANDLORD: "/landlord",
        ADMIN: "/admin",
      }[user.role];
      router.push(roleHome);
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

        <h1>Log in to your account</h1>
        <p className="muted">
          New here?{" "}
          <Link href="/register" className="link">
            Create an account
          </Link>
        </p>

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
            autoComplete="current-password"
            placeholder="••••••••"
          />

          {error && <Alert variant="error">{error}</Alert>}

          <button type="submit" disabled={pending} className="btn btn-block">
            <LogIn className="h-4 w-4" aria-hidden />
            {pending ? "Logging in…" : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}