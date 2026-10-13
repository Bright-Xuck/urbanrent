import type { ReactNode } from "react";
import { RoleShell } from "../../components/layout/RoleShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <RoleShell role="ADMIN">{children}</RoleShell>;
}
