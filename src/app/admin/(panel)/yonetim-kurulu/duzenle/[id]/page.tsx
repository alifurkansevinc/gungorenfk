import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/app/admin/actions";
import { BoardMemberForm } from "../../BoardMemberForm";

export default async function AdminYonetimKuruluDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getAdminSupabase();
  const { data: member } = await supabase.from("board_members").select("*").eq("id", id).single();
  if (!member) notFound();

  return (
    <div>
      <Link href="/admin/yonetim-kurulu" className="text-sm text-bordo hover:underline">← Yönetim Kurulu</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Üyeyi düzenle</h1>
      <BoardMemberForm member={member} />
    </div>
  );
}
