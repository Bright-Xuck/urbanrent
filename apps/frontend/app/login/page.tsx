"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { login } from "../../api/userApi";
import { useAuthStore } from "../../Store/useUserStore";
import { Input } from "../../components/ui/Fields";
import Alert from "../../components/ui/Alert";
import { AuthShell } from "../../components/auth/AuthShell";
import { GoogleAuthButton } from "../../components/auth/GoogleAuthButton";

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
    <AuthShell>
        <span className="auth-form-eyebrow">WELCOME BACK</span>
        <h1>Sign in to UrbanRent</h1>
        <p className="muted">
          New here?{" "}
          <Link href="/register" className="link">
            Create an account <span aria-hidden="true">→</span>
          </Link>
        </p>

        <div className="auth-provider">
          <GoogleAuthButton mode="login" />
        </div>
        <div className="auth-divider"><span>or continue with email</span></div>

        <form className="auth-form" onSubmit={handleSubmit}>
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
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
    </AuthShell>
  );
}