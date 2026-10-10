import type { ReactNode } from "react";
import { SessionGuard } from "../../components/auth/SessionGuard";
import { RoleShell } from "../../components/layout/RoleShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGuard roles={["ADMIN"]}>
      <RoleShell role="ADMIN">{children}</RoleShell>
    </SessionGuard>
  );
}
