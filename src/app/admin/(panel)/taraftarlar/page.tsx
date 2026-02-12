import Link from "next/link";
import { getAdminSupabase } from "../../actions";

export default async function AdminTaraftarlarPage() {
  const supabase = await getAdminSupabase();
  const { data: profiles } = await supabase
    .from("fan_profiles")
    .select("id, first_name, last_name, email, memleket_city_id, residence_city_id, points, created_at, fan_levels(name)")
    .order("created_at", { ascending: false })
    .limit(100);
  const { data: cities } = await supabase.from("cities").select("id, name");
  const cityMap = new Map((cities ?? []).map((c) => [c.id, c.name]));

  return (
    <div>
      <h1 className="text-2xl font-bold text-siyah">Taraftarlar</h1>
      <p className="mt-1 text-siyah/70">Kayıtlı taraftarlar ve memleket dağılımı (Anadolu Temsilcisi bar verisi).</p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] border border-black/10 text-sm">
          <thead>
            <tr className="bg-siyah/5">
              <th className="border-b p-2 text-left">Ad Soyad</th>
              <th className="border-b p-2 text-left">E-posta</th>
              <th className="border-b p-2 text-left">Memleket</th>
              <th className="border-b p-2 text-left">İkamet</th>
              <th className="border-b p-2">Puan</th>
              <th className="border-b p-2 text-left">Kayıt</th>
            </tr>
          </thead>
          <tbody>
            {(!profiles || profiles.length === 0) ? (
              <tr><td colSpan={6} className="p-4 text-siyah/60">Henüz taraftar yok.</td></tr>
            ) : (
              profiles.map((p) => (
                <tr key={p.id} className="border-b border-black/5">
                  <td className="p-2">{p.first_name} {p.last_name}</td>
                  <td className="p-2">{p.email}</td>
                  <td className="p-2">{cityMap.get(p.memleket_city_id) ?? "-"}</td>
                  <td className="p-2">{cityMap.get(p.residence_city_id) ?? "-"}</td>
                  <td className="p-2 text-center">{p.points}</td>
                  <td className="p-2">{new Date(p.created_at).toLocaleDateString("tr-TR")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
