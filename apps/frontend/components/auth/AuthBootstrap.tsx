"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { refreshSession } from "../../api/userApi";
import { useAuthStore } from "../../Store/useUserStore";

export function AuthBootstrap({ children }: { children: ReactNode }) {
  useEffect(() => {
    async function restoreSession() {
      try {
        await refreshSession();
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
