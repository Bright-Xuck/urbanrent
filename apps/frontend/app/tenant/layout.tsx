import type { ReactNode } from "react";
import { RoleShell } from "../../components/layout/RoleShell";

export default function TenantLayout({ children }: { children: ReactNode }) {
  return <RoleShell role="TENANT">{children}</RoleShell>;
}
