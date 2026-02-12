import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/app/admin/actions";
import { RozetFormu } from "../../RozetFormu";

export default async function AdminRozetDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) notFound();
  const supabase = await getAdminSupabase();
  const { data: level } = await supabase.from("fan_levels").select("*").eq("id", numId).single();
  if (!level) notFound();

  return (
    <div>
      <Link href="/admin/rozet" className="text-sm text-bordo hover:underline">← Rozet listesi</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Rozet kuralını düzenle: {level.name}</h1>
      <RozetFormu level={level} />
    </div>
  );
}
