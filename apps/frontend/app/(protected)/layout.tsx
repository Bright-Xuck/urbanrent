import type { ReactNode } from "react";
import { SessionGuard } from "../../components/auth/SessionGuard";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <SessionGuard>{children}</SessionGuard>;
}
