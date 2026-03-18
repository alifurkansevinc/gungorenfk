import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasValidBypass, getAdminStatusAndRole } from "../actions";
import type { AdminRole } from "@/lib/admin-roles";
import { AdminShell } from "./AdminShell";
import { AdminRouteGuard } from "./AdminRouteGuard";

export default async function AdminPanelLayout({
  children,
}: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/giris?reason=no_session");

  const bypass = await hasValidBypass();
  const { isAdmin, role: dbRole } = await getAdminStatusAndRole(user.id);
  if (!isAdmin) {
    if (!bypass) redirect("/admin/giris?reason=not_admin");
  }
  const role: AdminRole = isAdmin ? (dbRole ?? "admin") : "admin";

  return (
    <AdminShell role={role}>
      <AdminRouteGuard role={role}>{children}</AdminRouteGuard>
    </AdminShell>
  );
}
