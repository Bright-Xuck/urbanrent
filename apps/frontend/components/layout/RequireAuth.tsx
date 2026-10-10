"use client";

import type { ReactNode } from "react";
import type { Role } from "../../api/types";
import { SessionGuard } from "../auth/SessionGuard";

type RequireAuthProps = {
  children: ReactNode;
  roles?: readonly Role[];
  title?: string;
};

export default function RequireAuth({ children, roles }: RequireAuthProps) {
  return <SessionGuard roles={roles}>{children}</SessionGuard>;
}
