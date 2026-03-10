import { getAdminSupabase } from "@/app/admin/actions";
import { getGiftEligibleProductIds } from "@/lib/data";
import { KargoFormu } from "./KargoFormu";
import { BagisMakbuzFormu } from "./BagisMakbuzFormu";
import { GiftUrunForm } from "./GiftUrunForm";

export default async function AdminAyarlarPage() {
  const supabase = await getAdminSupabase();
  const [shippingRes, receiptRes, giftIds, productsRes] = await Promise.all([
    supabase.from("site_settings").select("value").eq("key", "shipping").single(),
    supabase.from("site_settings").select("value").eq("key", "donation_receipt_template").single(),
    getGiftEligibleProductIds(),
    supabase.from("store_products").select("id, name, slug").eq("is_active", true).order("sort_order"),
  ]);

  const row = shippingRes.data;
  const receiptRow = receiptRes.data;
  const value = (row?.value as { freeShippingThreshold?: number; standardShippingCost?: number; estimatedDeliveryDays?: string }) ?? {};
  const defaults = {
    freeShippingThreshold: 500,
    standardShippingCost: 29.9,
    estimatedDeliveryDays: "2-3",
  };
  const initial = {
    freeShippingThreshold: Number(value.freeShippingThreshold) || defaults.freeShippingThreshold,
    standardShippingCost: Number(value.standardShippingCost) ?? defaults.standardShippingCost,
    estimatedDeliveryDays: value.estimatedDeliveryDays ?? defaults.estimatedDeliveryDays,
  };

  const receiptVal = receiptRow?.value as { title?: string; body?: string } | undefined;
  const receiptInitial = {
    title: receiptVal?.title ?? "Bağış Makbuzu",
    body: receiptVal?.body ?? "Bu makbuz, Güngören Belediye Spor Kulübü'ne yapılan bağışı belgelemektedir. Bağışçıya ve kulübümüze verdiği destek için teşekkür ederiz.",
  };

  const productList = (productsRes.data ?? []) as { id: string; name: string; slug: string }[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-siyah">Ayarlar</h1>
      <p className="mt-1 text-siyah/70">Kargo, hediye ürünleri ve site ayarları. Etkinlik/maç pasif tuşları ilgili listelerde (Etkinlikler, Maçlar) her satırda.</p>
      <div className="mt-8 max-w-xl space-y-8">
        <GiftUrunForm products={productList} selectedIds={giftIds} />
        <KargoFormu initial={initial} />
        <BagisMakbuzFormu initial={receiptInitial} />
      </div>
    </div>
  );
}
