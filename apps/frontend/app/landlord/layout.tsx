import type { ReactNode } from "react";
import { SessionGuard } from "../../components/auth/SessionGuard";
import { RoleShell } from "../../components/layout/RoleShell";

export default function LandlordLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGuard roles={["LANDLORD"]}>
      <RoleShell role="LANDLORD">{children}</RoleShell>
    </SessionGuard>
  );
}
