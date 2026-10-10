import { redirect } from "next/navigation";

export default function TenantHomePage() {
  redirect("/tenant/applications");
}
