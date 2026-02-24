import { getAdminSupabase } from "@/app/admin/actions";
import { KargoFormu } from "./KargoFormu";
import { BagisMakbuzFormu } from "./BagisMakbuzFormu";

export default async function AdminAyarlarPage() {
  const supabase = await getAdminSupabase();
  const { data: row } = await supabase.from("site_settings").select("value").eq("key", "shipping").single();
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

  const { data: receiptRow } = await supabase.from("site_settings").select("value").eq("key", "donation_receipt_template").single();
  const receiptValue = (receiptRow?.value as { title?: string; body?: string }) ?? {};
  const receiptInitial = {
    title: receiptValue.title ?? "Bağış Makbuzu",
    body: receiptValue.body ?? "Bu makbuz, Güngören Belediye Spor Kulübü'ne yapılan bağışı belgelemektedir. Bağışçıya ve kulübümüze verdiği destek için teşekkür ederiz.",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-siyah">Ayarlar</h1>
      <p className="mt-1 text-siyah/70">Kargo ve site ayarları. Ödeme sayfasında kullanılır.</p>
      <div className="mt-8 max-w-xl space-y-8">
        <KargoFormu initial={initial} />
        <BagisMakbuzFormu initial={receiptInitial} />
      </div>
    </div>
  );
}
