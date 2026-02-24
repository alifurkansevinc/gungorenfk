import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/app/admin/actions";
import { AvantajModuluFormu } from "../../AvantajModuluFormu";

export default async function AdminAvantajModuluDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getAdminSupabase();
  const { data: module } = await supabase.from("benefit_modules").select("*").eq("id", id).single();
  if (!module) notFound();

  return (
    <div>
      <Link href="/admin/avantaj-modulleri" className="text-sm text-bordo hover:underline">← Avantaj modülleri</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Modülü düzenle: {module.name}</h1>
      <AvantajModuluFormu module={module} />
    </div>
  );
}
