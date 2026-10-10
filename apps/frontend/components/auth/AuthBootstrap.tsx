"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { restoreSession } from "../../lib/api-client";

export function AuthBootstrap({ children }: { children: ReactNode }) {
  useEffect(() => {
    void restoreSession();
  }, []);

  return children;
}
