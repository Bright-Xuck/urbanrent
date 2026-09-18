"use client";

// ============================================================
// SESSION BOOTSTRAP
// ============================================================
// The access token lives in memory (the Zustand store), so a page reload
// wipes it and every protected page falls back to the "you need to be
// logged in" wall — even though the refresh cookie is still sitting in the
// browser. The backend's POST /api/auth/refresh is the way to trade that
// cookie for a new access token, and nothing was calling it.
//
// So: once per mount, if there is no token in the store, ask for one.
//
// While that request is in flight nobody knows yet whether the visitor is
// signed in, so this component also publishes `restoring` through context.
// <RequireAuth> reads it and shows "Checking your session…" instead of
// accusing a signed-in visitor of being logged out.
//
// /auth/refresh returns ONLY { accessToken } (no user), so the id/email/
// role the UI needs are read back out of the token payload. That is not a
// security check — the server verifies the signature on every real request
// — it just restores what the header and <RequireAuth> render.
// ============================================================

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { refreshSession } from "../../api/userApi";
import { useAuthStore, type User } from "../../Store/useUserStore";

const RestoringContext = createContext(false);

/**
 * True while a session restore is in flight and the answer isn't known yet.
 * Outside the provider it is simply false.
 */
export function useSessionRestoring(): boolean {
  return useContext(RestoringContext);
}

// Decodes the payload of a JWT (the middle of the three dot-separated
// parts) and keeps only the fields we expect. A token whose shape we don't
// recognise returns null, so nothing unexpected lands in the store.
function readUserFromToken(token: string): User | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    // JWTs use base64url; atob() wants plain base64.
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json) as {
      userId?: string;
      email?: string;
      role?: string;
    };

    if (!claims.userId || !claims.role) return null;
    if (
      claims.role !== "TENANT" &&
      claims.role !== "LANDLORD" &&
      claims.role !== "ADMIN"
    ) {
      return null;
    }

    return { id: claims.userId, email: claims.email ?? null, role: claims.role };
  } catch {
    return null;
  }
}

export default function SessionBootstrap({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setSession = useAuthStore((state) => state.login);

  // Seeded from the store rather than set inside the effect, so the very
  // first render already knows a restore is coming. The store is empty
  // during prerender AND on a fresh client load, so this agrees with the
  // server-rendered HTML — no hydration mismatch.
  const [restoring, setRestoring] = useState(
    () => !useAuthStore.getState().accessToken
  );

  // React runs effects twice in development. Without this guard the page
  // would fire two refresh calls on every load.
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    if (accessToken) {
      setRestoring(false);
      return;
    }

    refreshSession()
      .then(({ accessToken: fresh }) => {
        const user = readUserFromToken(fresh);
        if (user) setSession(user, fresh);
      })
      .catch(() => {
        // No cookie, or it expired/was revoked. Staying logged out is the
        // correct outcome — no need to surface an error to the visitor.
      })
      .finally(() => setRestoring(false));
  }, [accessToken, setSession]);

  return (
    <RestoringContext.Provider value={restoring}>
      {children}
    </RestoringContext.Provider>
  );
}
