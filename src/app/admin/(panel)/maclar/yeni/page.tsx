import Link from "next/link";
import { getAdminSupabase } from "@/app/admin/actions";
import { MacForm } from "../MacForm";

export default async function AdminMaclarYeniPage() {
  const supabase = await getAdminSupabase();
  const { data: squad } = await supabase.from("squad").select("id, name, shirt_number").eq("is_active", true).order("sort_order");

  return (
    <div>
      <Link href="/admin/maclar" className="text-sm text-bordo hover:underline">← Maç listesi</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Yeni maç</h1>
      <MacForm squad={squad ?? []} />
    </div>
  );
}
