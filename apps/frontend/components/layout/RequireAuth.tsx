"use client";

// ============================================================
// REQUIRE AUTH
// ============================================================
// The "log in to continue" wall that used to be copy-pasted into every
// protected page. Wrap a page's content with it:
//
//   <RequireAuth roles={["LANDLORD", "ADMIN"]}>…page…</RequireAuth>
//
//   - nobody logged in  → log-in panel
//   - role not allowed  → "wrong account type" panel
//   - allowed           → the children render
// ============================================================

import Link from "next/link";
import { LogIn } from "lucide-react";
import type { ReactNode } from "react";
import type { Role } from "../../api/types";
import { useAuthStore } from "../../Store/useUserStore";

type RequireAuthProps = {
  children: ReactNode;
  /** Which roles may see the content. Omit to allow any signed-in user. */
  roles?: Role[];
  title?: string;
};

export default function RequireAuth({ children, roles, title = "This page" }: RequireAuthProps) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-2xl text-ink">{title}</h1>
        <p className="mt-2 text-sm text-ink-soft">
          You need to be logged in to view this page.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 border border-navy bg-navy px-5 py-2.5 text-sm text-paper hover:bg-navy-dark"
        >
          <LogIn className="h-4 w-4" aria-hidden /> Log in
        </Link>
      </div>
    );
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-display text-2xl text-ink">{title}</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Your account ({user.role.toLowerCase()}) doesn't have access to this
          page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}