import type { ReactNode } from "react";
import { SessionGuard } from "../../../components/auth/SessionGuard";
import { RoleShell } from "../../../components/layout/RoleShell";

export default function TenantLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGuard roles={["TENANT"]}>
      <RoleShell role="TENANT">{children}</RoleShell>
    </SessionGuard>
  );
}
