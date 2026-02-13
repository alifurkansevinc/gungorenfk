import { getAdminSupabase } from "@/app/admin/actions";
import { redirect } from "next/navigation";
import { KargoFormu } from "./KargoFormu";

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-siyah">Ayarlar</h1>
      <p className="mt-1 text-siyah/70">Kargo ve site ayarları. Ödeme sayfasında kullanılır.</p>
      <div className="mt-8 max-w-xl">
        <KargoFormu initial={initial} />
      </div>
    </div>
  );
}
