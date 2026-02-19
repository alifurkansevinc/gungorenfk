import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/app/admin/actions";
import { getModuleByKey } from "@/lib/featured-modules";
import { OneCikanEditForm } from "../../OneCikanEditForm";

export default async function AdminOneCikanDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getAdminSupabase();
  const { data: item } = await supabase.from("homepage_featured").select("*").eq("id", id).single();
  if (!item) notFound();
  const def = getModuleByKey(item.module_key);

  return (
    <div>
      <Link href="/admin/one-cikan" className="text-sm text-bordo hover:underline">← Öne Çıkan listesi</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Modülü düzenle</h1>
      <p className="mt-1 text-siyah/60">Modül: {def?.label ?? item.module_key}</p>
      <OneCikanEditForm
        id={item.id}
        title={item.title ?? ""}
        subtitle={item.subtitle ?? ""}
        image_url={item.image_url}
        link={item.link ?? ""}
        is_large={item.is_large}
      />
    </div>
  );
}
