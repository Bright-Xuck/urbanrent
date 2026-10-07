"use client";

// ============================================================
// USE SESSION RESTORE
// ============================================================
// On mount, if the store has no access token, trade the refresh cookie
// (POST /api/auth/refresh) for a new one and put the decoded user back in
// the store. While that request is in flight the store's
// `sessionRestoring` flag is true so <RequireAuth> can show "Checking your
// session…" instead of the log-in wall.
//
// The backend's refresh endpoint returns ONLY { accessToken } (no user), so
// the id/email/role are read back out of the JWT payload. That is not a
// security check — the server verifies the signature on every real request —
// it just restores what the header and <RequireAuth> render.
// ============================================================

import { useEffect, useRef } from "react";
import { refreshSession } from "../../api/userApi";
import { useAuthStore, type User } from "../../Store/useUserStore";

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

    return {
      id: claims.userId,
      email: claims.email ?? null,
      role: claims.role,
    };
  } catch {
    return null;
  }
}

export function useSessionRestore() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setSession = useAuthStore((state) => state.login);
  const setSessionRestoring = useAuthStore((state) => state.setSessionRestoring);

  // React runs effects twice in development. Without this guard the page
  // would fire two refresh calls on every load.
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    const restore = async () => {
      // Nothing to restore if a token is already in the store.
      if (accessToken) {
        setSessionRestoring(false);
        return;
      }

      // Mark the session as "being restored" so <RequireAuth> can show a
      // brief "Checking your session…" message instead of the log-in wall.
      setSessionRestoring(true);

      try {
        const { accessToken: fresh } = await refreshSession();
        const user = readUserFromToken(fresh);
        if (user) setSession(user, fresh);
      } catch {
        // No cookie, or it expired/was revoked. Staying logged out is the
        // correct outcome — no need to surface an error to the visitor.
      } finally {
        setSessionRestoring(false);
      }
    };

    restore();
  }, [accessToken, setSession, setSessionRestoring]);
}
