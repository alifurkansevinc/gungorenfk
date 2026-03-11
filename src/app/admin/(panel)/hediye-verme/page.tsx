import { getAdminSupabase } from "../../actions";
import { HediyeVermePanel } from "./HediyeVermePanel";

export default async function AdminHediyeVermePage() {
  const supabase = await getAdminSupabase();
  const [profilesRes, productsRes] = await Promise.all([
    supabase
      .from("fan_profiles")
      .select("user_id, first_name, last_name, email")
      .not("user_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(300),
    supabase
      .from("store_products")
      .select("id, name, slug, price")
      .eq("is_active", true)
      .order("name"),
  ]);
  const members = (profilesRes.data ?? []).map((p) => ({
    userId: (p as { user_id: string }).user_id,
    label: `${(p as { first_name: string }).first_name} ${(p as { last_name: string }).last_name} (${(p as { email: string }).email ?? ""})`,
  }));
  const products = productsRes.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-siyah">Hediye Verme</h1>
        <p className="mt-1 text-siyah/70">
          Üye seçin; storedan hediye (QR ile teslim) veya ürün bazlı indirim atayın. Beyaz rozet üyeye QR kod olarak buradan verilir.
        </p>
      </div>
      <HediyeVermePanel members={members} products={products} />
    </div>
  );
}
