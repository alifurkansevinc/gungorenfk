import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getFeaturedProducts, getGiftQuotaForLevel } from "@/lib/data";
import { HediyeKullanForm } from "./HediyeKullanForm";

export const metadata = {
  title: "Hediye hakkını kullan | Benim Köşem | Güngören FK",
  description: "Rütbenizden kazanılan hediye hakkı ile mağaza ürünü seçin; ücretsiz, QR ile mağazadan teslim alırsınız.",
};

export default async function HediyeKullanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/taraftar/kayit");

  const { data: profile } = await supabase.from("fan_profiles").select("fan_level_id").eq("user_id", user.id).single();
  const levelId = (profile as { fan_level_id?: number } | null)?.fan_level_id ?? 1;
  const [quota, usedCount, products] = await Promise.all([
    getGiftQuotaForLevel(levelId),
    supabase.from("gift_redemptions").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("redemption_year", new Date().getFullYear()).then((r) => r.count ?? 0),
    getFeaturedProducts(100),
  ]);

  const remaining = Math.max(0, quota - (usedCount ?? 0));
  if (quota <= 0) redirect("/benim-kosem");
  if (remaining <= 0) redirect("/benim-kosem");

  const productList = Array.isArray(products) ? products : [];
  if (productList.length === 0) redirect("/benim-kosem");

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="border-b border-siyah/10 bg-siyah text-beyaz">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <nav className="text-sm text-beyaz/60">
            <Link href="/benim-kosem" className="hover:text-beyaz">Benim Köşem</Link>
            <span className="mx-2">/</span>
            <span className="text-beyaz">Hediye hakkını kullan</span>
          </nav>
          <h1 className="font-display mt-2 text-2xl font-bold sm:text-3xl">Hediye hakkını kullan</h1>
          <p className="mt-2 text-sm text-beyaz/80">Bir mağaza ürünü seçin; ücretsiz olarak QR ile mağazadan teslim alacaksınız. Kalan hak: <strong>{remaining}</strong>.</p>
        </div>
      </div>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <HediyeKullanForm products={productList} />
        <p className="mt-6 text-center">
          <Link href="/benim-kosem" className="text-sm font-medium text-bordo hover:underline">← Benim Köşem’e dön</Link>
        </p>
      </div>
    </div>
  );
}
