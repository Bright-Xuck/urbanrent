"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";
import type { Role } from "../../api/types";
import { useAuthStore } from "../../Store/useUserStore";
import { restoreSession } from "../../lib/api-client";

type SessionGuardProps = {
  children: ReactNode;
  roles?: readonly Role[];
};

const ROLE_HOME: Record<Role, string> = {
  TENANT: "/tenant",
  LANDLORD: "/landlord",
  ADMIN: "/admin",
};

export function SessionGuard({ children, roles }: SessionGuardProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const sessionStatus = useAuthStore((state) => state.sessionStatus);
  const sessionNotice = useAuthStore((state) => state.sessionNotice);

  useEffect(() => {
    if (user && roles && !roles.includes(user.role)) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [roles, router, user]);

  if (sessionStatus === "checking") {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-7xl items-center px-5 py-12">
        <p role="status" className="text-sm text-ink-soft">
          Restoring your session…
        </p>
      </main>
    );
  }

  if (sessionStatus === "error") {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-7xl flex-col items-start justify-center gap-4 px-5 py-12">
        <h1 className="font-display text-2xl font-semibold text-ink">
          We couldn’t check your session
        </h1>
        <p className="max-w-xl text-sm text-ink-soft">
          The authentication service could not be reached. Check your
          connection, then try again.
        </p>
        <button
          className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white"
          onClick={() => void restoreSession()}
          type="button"
        >
          Try again
        </button>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-[50vh] max-w-7xl flex-col items-start justify-center gap-4 px-5 py-12">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Sign in to continue
        </h1>
        <p className="text-sm text-ink-soft">
          This area is available to signed-in UrbanRent members.
        </p>
        {sessionNotice ? (
          <p className="max-w-xl text-sm text-danger" role="status">
            {sessionNotice}
          </p>
        ) : null}
        <Link
          className="rounded-lg bg-navy px-4 py-2.5 text-sm font-semibold text-white"
          href="/login"
        >
          Go to sign in
        </Link>
      </main>
    );
  }

  if (roles && !roles.includes(user.role)) return null;

  return children;
}
