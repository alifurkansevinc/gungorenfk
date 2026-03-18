import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasValidBypass, getAdminStatusAndRole } from "../actions";
import type { AdminRole } from "@/lib/admin-roles";
import { AdminShell } from "./AdminShell";
import { AdminRouteGuard } from "./AdminRouteGuard";

export default async function AdminPanelLayout({
  children,
}: { children: React.ReactNode }) {
  let role: AdminRole = "admin";
  const bypass = await hasValidBypass();
  if (!bypass) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/admin/giris?reason=no_session");
    const { isAdmin, role: adminRole } = await getAdminStatusAndRole(user.id);
    if (!isAdmin) redirect("/admin/giris?reason=not_admin");
    if (adminRole) role = adminRole;
  }

  return (
    <AdminShell role={role}>
      <AdminRouteGuard role={role}>{children}</AdminRouteGuard>
    </AdminShell>
  );
}
