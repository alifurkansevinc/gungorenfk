import Link from "next/link";
import { getAdminSupabase } from "../../actions";

export default async function AdminRozetPage() {
  const supabase = await getAdminSupabase();
  const { data: levels } = await supabase
    .from("fan_levels")
    .select("id, name, slug, min_points, sort_order, description, target_store_spend, target_tickets, target_donation")
    .order("sort_order");

  return (
    <div>
      <h1 className="text-2xl font-bold text-siyah">Rozet kuralları</h1>
      <p className="mt-1 text-siyah/70">Taraftar rozet kademeleri: min puan, hedef mağaza/hangi/bagış. Benim Köşem ve taraftar rozetleri buradan beslenir.</p>
      <div className="mt-6 overflow-hidden rounded-xl border border-siyah/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-siyah/5">
            <tr>
              <th className="px-4 py-3 font-semibold text-siyah/70">Kademe</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Slug</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Min puan</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Mağaza hedef (₺)</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Bilet hedef</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">Bağış hedef (₺)</th>
              <th className="px-4 py-3 font-semibold text-siyah/70">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {(!levels || levels.length === 0) ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-siyah/60">Rozet kademesi bulunamadı.</td></tr>
            ) : (
              levels.map((l) => (
                <tr key={l.id} className="border-t border-siyah/5 hover:bg-siyah/[0.02]">
                  <td className="px-4 py-3 font-medium text-siyah">{l.name}</td>
                  <td className="px-4 py-3 text-siyah/70">{l.slug}</td>
                  <td className="px-4 py-3 text-siyah/80">{l.min_points}</td>
                  <td className="px-4 py-3 text-siyah/80">{l.target_store_spend != null ? Number(l.target_store_spend).toFixed(0) : "—"}</td>
                  <td className="px-4 py-3 text-siyah/80">{l.target_tickets ?? "—"}</td>
                  <td className="px-4 py-3 text-siyah/80">{l.target_donation != null ? Number(l.target_donation).toFixed(0) : "—"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/rozet/duzenle/${l.id}`} className="text-bordo font-medium hover:underline">Düzenle</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
