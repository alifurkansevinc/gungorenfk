import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const [
    { count: fansCount },
    { count: matchesCount },
    { count: newsCount },
    { count: productsCount },
  ] = await Promise.all([
    supabase.from("fan_profiles").select("id", { count: "exact", head: true }),
    supabase.from("matches").select("id", { count: "exact", head: true }),
    supabase.from("news").select("id", { count: "exact", head: true }),
    supabase.from("store_products").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-siyah">Admin Dashboard</h1>
      <p className="mt-1 text-siyah/70">Tüm içerik buradan güncellenebilir.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/taraftarlar" className="rounded-xl border border-black/10 bg-beyaz p-6 hover:bg-black/5">
          <p className="text-2xl font-bold text-bordo">{fansCount ?? 0}</p>
          <p className="text-sm text-siyah/70">Taraftar</p>
        </Link>
        <Link href="/admin/maclar" className="rounded-xl border border-black/10 bg-beyaz p-6 hover:bg-black/5">
          <p className="text-2xl font-bold text-bordo">{matchesCount ?? 0}</p>
          <p className="text-sm text-siyah/70">Maç</p>
        </Link>
        <Link href="/admin/haberler" className="rounded-xl border border-black/10 bg-beyaz p-6 hover:bg-black/5">
          <p className="text-2xl font-bold text-bordo">{newsCount ?? 0}</p>
          <p className="text-sm text-siyah/70">Haber</p>
        </Link>
        <Link href="/admin/magaza" className="rounded-xl border border-black/10 bg-beyaz p-6 hover:bg-black/5">
          <p className="text-2xl font-bold text-bordo">{productsCount ?? 0}</p>
          <p className="text-sm text-siyah/70">Mağaza ürünü</p>
        </Link>
      </div>
      <p className="mt-8 text-sm text-siyah/60">Maçlar, kadro, haberler, galeriler ve mağaza için üst menüden ilgili sayfaya gidip ekleme/düzenleme yapabilirsiniz. CRUD sayfaları sırayla genişletilecek.</p>
    </div>
  );
}
