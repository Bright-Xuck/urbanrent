"use client";

// ============================================================
// MY PROFILE
// ============================================================
// There is no profile endpoint on the backend yet — the schema has no
// name, phone, or avatar columns. So this page shows what actually exists:
// the session itself (email + role from the store) and a way to end it.
//
// It deliberately does NOT show editable fields, because saving them
// would have nowhere to go.
// ============================================================

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Mail, ShieldCheck } from "lucide-react";
import RequireAuth from "../../../components/layout/RequireAuth";
import PageHeader from "../../../components/layout/PageHeader";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import StatusBadge from "../../../components/ui/StatusBadge";
import { logout } from "../../../api/userApi";
import { useAuthStore } from "../../../Store/useUserStore";

export default function MyProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.logout);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // The cookie may already be revoked — still clear locally.
    }
    clearSession();
    router.push("/");
  }

  return (
    <RequireAuth title="My profile">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <PageHeader
          title="My profile"
          subtitle="Your session details, and the record of what you've done."
        />

        {user && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <Card>
              <Mail className="h-5 w-5 text-navy" aria-hidden />
              <h2 className="mt-3 font-display text-lg text-ink">Email</h2>
              <p className="mt-1 break-all text-sm text-ink-soft">
                {user.email}
              </p>
            </Card>

            <Card>
              <ShieldCheck className="h-5 w-5 text-navy" aria-hidden />
              <h2 className="mt-3 font-display text-lg text-ink">Account type</h2>
              <p className="mt-2">
                <StatusBadge status={user.role} />
              </p>
              <p className="mt-3 text-xs text-ink-soft">
                Landlord access is granted by an administrator.
              </p>
            </Card>
          </div>
        )}

        <div className="mt-8 border border-line p-6">
          <h2 className="font-display text-lg text-ink">Your record</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Everything you've submitted lives on these two pages:
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/applications" className="text-navy underline">
              My applications
            </Link>
            <Link href="/viewings" className="text-navy underline">
              My viewings
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-line pt-6">
          <Button variant="ghost" onClick={handleLogout}>
            <span className="inline-flex items-center gap-2">
              <LogOut className="h-4 w-4" aria-hidden /> Log out
            </span>
          </Button>
        </div>
      </div>
    </RequireAuth>
  );
}