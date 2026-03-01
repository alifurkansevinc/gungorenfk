import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/app/admin/actions";
import { TrophyForm } from "../../TrophyForm";

export default async function AdminKupaMuzesiDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getAdminSupabase();
  const { data: trophy } = await supabase.from("club_trophies").select("*").eq("id", id).single();
  if (!trophy) notFound();

  return (
    <div>
      <Link href="/admin/kupa-muzesi" className="text-sm text-bordo hover:underline">← Kupa Müzesi</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Kupayı düzenle</h1>
      <TrophyForm trophy={trophy} />
    </div>
  );
}
