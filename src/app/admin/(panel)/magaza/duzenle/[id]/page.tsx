import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/app/admin/actions";
import { UrunFormu } from "../../UrunFormu";
import { ArrowLeft } from "lucide-react";

export default async function AdminMagazaDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getAdminSupabase();
  const { data: product } = await supabase.from("store_products").select("*").eq("id", id).single();
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/magaza"
        className="inline-flex items-center gap-2 text-sm font-medium text-bordo hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Mağaza listesi
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ürünü düzenle</h1>
        <p className="mt-1 text-gray-500">{product.name}</p>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <UrunFormu product={product} />
      </div>
    </div>
  );
}
