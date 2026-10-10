import type { ReactNode } from "react";
import { RoleShell } from "../../components/layout/RoleShell";

export default function LandlordLayout({ children }: { children: ReactNode }) {
  return <RoleShell role="LANDLORD">{children}</RoleShell>;
}
