"use client";

// ============================================================
// REQUIRE AUTH
// ============================================================
// The "log in to continue" wall that used to be copy-pasted into every
// protected page. Wrap a page's content with it:
//
//   <RequireAuth roles={["LANDLORD", "ADMIN"]}>…page…</RequireAuth>
//
//   session restore pending → "Checking your session…"
//   nobody logged in        → log-in panel
//   role not allowed        → "wrong account type" panel
//   allowed                 → the children render
//
// That first case matters on a reload: the access token lives in memory,
// and <SessionBootstrap> is exchanging the refresh cookie for a new one at
// the same moment this component first renders. Without it, a signed-in
// visitor reloading the page would be told to log in.
// ============================================================

import Link from "next/link";
import { LogIn } from "lucide-react";
import type { ReactNode } from "react";
import type { Role } from "../../api/types";
import { useAuthStore } from "../../Store/useUserStore";
import { useSessionRestoring } from "./SessionBootstrap";

type RequireAuthProps = {
  children: ReactNode;
  /** Which roles may see the content. Omit to allow any signed-in user. */
  roles?: Role[];
  title?: string;
};

export default function RequireAuth({ children, roles, title = "This page" }: RequireAuthProps) {
  const user = useAuthStore((state) => state.user);
  const restoring = useSessionRestoring();

  if (!user && restoring) {
    return (
      <div className="rp-container rp-section">
        <h1 className="page-title">{title}</h1>
        <p className="page-sub">Checking your session…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rp-container rp-section">
        <div className="empty-state">
          <h3>{title}</h3>
          <p>You need to be logged in to view this page.</p>
          <Link href="/login" className="btn mt-5">
            <LogIn className="h-4 w-4" aria-hidden /> Log in
          </Link>
        </div>
      </div>
    );
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="rp-container rp-section">
        <div className="empty-state">
          <h3>{title}</h3>
          <p>
            Your account ({user.role.toLowerCase()}) doesn&apos;t have access to
            this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}