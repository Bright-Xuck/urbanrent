"use client";

import Link from "next/link";
import { Mail, ShieldCheck } from "lucide-react";
import { useAuthStore } from "../../Store/useUserStore";
import PageHeader from "../../components/layout/PageHeader";
import Card from "../../components/ui/Card";
import StatusBadge from "../../components/ui/StatusBadge";

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);

  if (!initialized) {
    return <p className="mx-auto max-w-3xl px-6 py-10 text-sm text-ink-soft" role="status">Checking your sign-in…</p>;
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-start justify-center gap-4 px-6 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Sign in to view your profile</h1>
        <Link className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white" href="/login">
          Go to sign in
        </Link>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <PageHeader title="My profile" subtitle="Your UrbanRent account details." />

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <Card>
          <Mail className="h-5 w-5 text-navy" aria-hidden />
          <h2 className="mt-3 font-display text-lg text-ink">Email</h2>
          <p className="mt-1 break-all text-sm text-ink-soft">{user.email}</p>
        </Card>

        <Card>
          <ShieldCheck className="h-5 w-5 text-navy" aria-hidden />
          <h2 className="mt-3 font-display text-lg text-ink">Account type</h2>
          <p className="mt-2"><StatusBadge status={user.role} /></p>
          {user.role === "LANDLORD" ? (
            <p className="mt-3">
              <Link href="/landlord/verification" className="text-navy underline">
                Manage verification
              </Link>
            </p>
          ) : null}
        </Card>
      </div>

      {user.role === "TENANT" ? (
        <div className="mt-8 border border-line p-6">
          <h2 className="font-display text-lg text-ink">Your activity</h2>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/tenant/applications" className="text-navy underline">My applications</Link>
            <Link href="/tenant/viewings" className="text-navy underline">My viewings</Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
