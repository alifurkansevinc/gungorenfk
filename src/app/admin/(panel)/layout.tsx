import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasValidBypass } from "../actions";
import { AdminShell } from "./AdminShell";

export default async function AdminPanelLayout({
  children,
}: { children: React.ReactNode }) {
  const bypass = await hasValidBypass();
  if (!bypass) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/admin/giris");
    const { data: adminRow } = await supabase.from("admin_users").select("id").eq("user_id", user.id).single();
    if (!adminRow) redirect("/admin/giris");
  }

  return <AdminShell>{children}</AdminShell>;
}
