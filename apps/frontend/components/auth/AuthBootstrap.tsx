"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { refreshSession } from "../../api/userApi";
import type { User } from "../../Store/useUserStore";
import { useAuthStore } from "../../Store/useUserStore";

function getUserFromToken(token: string): User | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const claims: unknown = JSON.parse(atob(padded));
    if (typeof claims !== "object" || claims === null) return null;

    const id = "userId" in claims ? claims.userId : undefined;
    const email = "email" in claims ? claims.email : undefined;
    const role = "role" in claims ? claims.role : undefined;
    if (
      typeof id !== "string" ||
      (role !== "TENANT" && role !== "LANDLORD" && role !== "ADMIN")
    ) {
      return null;
    }

    return {
      id,
      email: typeof email === "string" ? email : null,
      role,
    };
  } catch {
    return null;
  }
}

export function AuthBootstrap({ children }: { children: ReactNode }) {
  useEffect(() => {
    async function restoreSession() {
      try {
        const { accessToken } = await refreshSession();
        const user = getUserFromToken(accessToken);
        if (!user) throw new Error("The authentication service returned an invalid token.");
        useAuthStore.getState().login(user, accessToken);
      } catch (error) {
        console.error("Could not restore the UrbanRent session.", error);
      } finally {
        useAuthStore.getState().finishInitialization();
      }
    }

    void restoreSession();
  }, []);

  return children;
}
