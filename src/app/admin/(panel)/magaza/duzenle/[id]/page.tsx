import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { UrunFormu } from "../../UrunFormu";

export default async function AdminMagazaDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase.from("store_products").select("*").eq("id", id).single();
  if (!product) notFound();

  return (
    <div>
      <Link href="/admin/magaza" className="text-sm text-bordo hover:underline">← Mağaza listesi</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Ürünü düzenle</h1>
      <UrunFormu product={product} />
    </div>
  );
}
