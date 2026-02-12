import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/app/admin/actions";
import { TechnicalStaffForm } from "../../TechnicalStaffForm";

export default async function AdminTeknikHeyetDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getAdminSupabase();
  const { data: member } = await supabase.from("technical_staff").select("*").eq("id", id).single();
  if (!member) notFound();

  return (
    <div>
      <Link href="/admin/teknik-heyet" className="text-sm text-bordo hover:underline">← Teknik Heyet</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Üyeyi düzenle</h1>
      <TechnicalStaffForm member={member} />
    </div>
  );
}
