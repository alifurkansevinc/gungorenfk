import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/app/admin/actions";
import { MacForm } from "../../MacForm";

export default async function AdminMaclarDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getAdminSupabase();
  const { data: match } = await supabase.from("matches").select("*").eq("id", id).single();
  if (!match) notFound();

  return (
    <div>
      <Link href="/admin/maclar" className="text-sm text-bordo hover:underline">← Maç listesi</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Maçı düzenle</h1>
      <MacForm match={match} />
    </div>
  );
}
