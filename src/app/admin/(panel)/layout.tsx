import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasValidBypass, hasAdminUserRoleColumn } from "../actions";
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
    const hasRoleColumn = await hasAdminUserRoleColumn();
    const { data: adminRow } = hasRoleColumn
      ? await supabase.from("admin_users").select("id, role").eq("user_id", user.id).single()
      : await supabase.from("admin_users").select("id").eq("user_id", user.id).single();
    if (!adminRow) redirect("/admin/giris?reason=not_admin");
    role = (hasRoleColumn ? (adminRow as { role?: AdminRole }).role ?? "admin" : "admin") as AdminRole;
  }

  return (
    <AdminShell role={role}>
      <AdminRouteGuard role={role}>{children}</AdminRouteGuard>
    </AdminShell>
  );
}
