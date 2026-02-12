import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/app/admin/actions";
import { SquadForm } from "../../SquadForm";

export default async function AdminKadroDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getAdminSupabase();
  const { data: member } = await supabase.from("squad").select("*").eq("id", id).single();
  if (!member) notFound();

  return (
    <div>
      <Link href="/admin/kadro" className="text-sm text-bordo hover:underline">← Kadro listesi</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Oyuncuyu düzenle</h1>
      <SquadForm member={member} />
    </div>
  );
}
