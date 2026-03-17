import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasValidBypass } from "../actions";
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
    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("id, role")
      .eq("user_id", user.id)
      .single();
    if (!adminRow) redirect("/admin/giris?reason=not_admin");
    role = (adminRow.role ?? "admin") as AdminRole;
  }

  return (
    <AdminShell role={role}>
      <AdminRouteGuard role={role}>{children}</AdminRouteGuard>
    </AdminShell>
  );
}
