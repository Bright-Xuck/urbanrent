"use client";

// ============================================================
// ADMIN LAYOUT — /admin section
// ============================================================
// One guard + one frame for the whole admin section:
//
//   session restore pending  -> "Checking your session..."
//   nobody logged in         -> the log-in wall
//   signed in, not ADMIN     -> redirected to their own dashboard
//   ADMIN                    -> admin sidebar + section content
//
// The guard waits for session restore to finish — on a hard reload the
// access token starts empty in memory, and bouncing on that first frame
// would throw signed-in admins out of the section.
// ============================================================

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { useAuthStore } from "../../../Store/useUserStore";
import AdminSidebar from "../../../components/layout/AdminSidebar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const restoring = useAuthStore((state) => state.sessionRestoring);

  useEffect(() => {
    if (!restoring && user && user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [restoring, user, router]);

  if (!user && restoring) {
    return (
      <div className="rp-container rp-section">
        <p className="page-sub">Checking your session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rp-container rp-section">
        <div className="empty-state">
          <h3>Admin area</h3>
          <p>You need to be logged in to view this page.</p>
          <Link href="/login" className="btn mt-5">
            <LogIn className="h-4 w-4" aria-hidden /> Log in
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== "ADMIN") {
    // The redirect above is in flight — render nothing for that one frame
    // instead of flashing a wrong-role panel first.
    return null;
  }

  return (
    <div className="rp-container rp-section">
      <div className="grid items-start gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        <AdminSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
