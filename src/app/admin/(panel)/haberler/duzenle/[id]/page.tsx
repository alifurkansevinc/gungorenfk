import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/app/admin/actions";
import { HaberFormu } from "../../HaberFormu";

export default async function AdminHaberlerDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getAdminSupabase();
  const { data: news } = await supabase.from("news").select("*").eq("id", id).single();
  if (!news) notFound();

  return (
    <div>
      <Link href="/admin/haberler" className="text-sm text-bordo hover:underline">← Etkinlikler listesi</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Etkinliği düzenle</h1>
      <HaberFormu news={news} />
    </div>
  );
}
