import { getAdminSupabase } from "../../actions";
import { Users, UserPlus, MapPin } from "lucide-react";
import { AdminTaraftarlarFilter } from "./AdminTaraftarlarFilter";

function parseDateRange(baslangic?: string, bitis?: string): { start: string | null; end: string | null } {
  if (!baslangic || !bitis) return { start: null, end: null };
  const startMatch = baslangic.match(/^\d{4}-\d{2}-\d{2}$/);
  const endMatch = bitis.match(/^\d{4}-\d{2}-\d{2}$/);
  if (!startMatch || !endMatch) return { start: null, end: null };
  return {
    start: `${baslangic}T00:00:00Z`,
    end: `${bitis}T23:59:59.999Z`,
  };
}

export default async function AdminTaraftarlarPage({
  searchParams,
}: {
  searchParams: Promise<{ arama?: string; baslangic?: string; bitis?: string; memleket?: string }>;
}) {
  const params = await searchParams;
  const { arama, baslangic, bitis, memleket } = params;

  const supabase = await getAdminSupabase();
  const { data: cities } = await supabase.from("cities").select("id, name").order("name");
  const cityMap = new Map((cities ?? []).map((c) => [c.id, c.name]));
  const cityOptions = (cities ?? []).map((c) => ({ id: c.id, name: c.name }));

  const { start: rangeStart, end: rangeEnd } = parseDateRange(baslangic, bitis);
  const memleketId = memleket && /^\d+$/.test(memleket) ? parseInt(memleket, 10) : null;

  // Dashboard: toplam, bu ay kayıt, farklı memleket sayısı
  const [totalRes, thisMonthRes, memleketRes] = await Promise.all([
    supabase.from("fan_profiles").select("id", { count: "exact", head: true }),
    (() => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
      return supabase.from("fan_profiles").select("id", { count: "exact", head: true }).gte("created_at", start).lte("created_at", end);
    })(),
    supabase.from("fan_profiles").select("memleket_city_id"),
  ]);

  let profilesQuery = supabase
    .from("fan_profiles")
    .select("id, first_name, last_name, email, memleket_city_id, residence_city_id, points, created_at, fan_levels(name)")
    .order("created_at", { ascending: false })
    .limit(500);

  if (rangeStart && rangeEnd) {
    profilesQuery = profilesQuery.gte("created_at", rangeStart).lte("created_at", rangeEnd);
  }
  if (memleketId != null) {
    profilesQuery = profilesQuery.eq("memleket_city_id", memleketId);
  }

  const { data: profilesRaw } = await profilesQuery;

  const aramaLower = (arama?.trim() ?? "").toLowerCase();
  const profiles =
    !aramaLower && profilesRaw
      ? profilesRaw
      : (profilesRaw ?? []).filter((p) => {
          const fullName = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim();
          const email = (p.email ?? "").toLowerCase();
          return fullName.toLowerCase().includes(aramaLower) || email.includes(aramaLower);
        });

  const totalCount = totalRes.count ?? 0;
  const thisMonthCount = thisMonthRes.count ?? 0;
  const distinctMemleket = new Set((memleketRes.data ?? []).map((r) => r.memleket_city_id)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-siyah">Taraftarlar</h1>
        <p className="mt-1 text-siyah/70">Kayıtlı taraftarlar ve memleket dağılımı (Anadolu Temsilcisi bar verisi).</p>
      </div>

      {/* Dashboard */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-siyah/10 bg-beyaz p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-bordo/10 p-3">
              <Users className="h-6 w-6 text-bordo" />
            </div>
            <div>
              <p className="text-sm font-medium text-siyah/70">Toplam taraftar</p>
              <p className="text-2xl font-bold text-siyah">{totalCount.toLocaleString("tr-TR")}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-siyah/10 bg-beyaz p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-green-100 p-3">
              <UserPlus className="h-6 w-6 text-green-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-siyah/70">Bu ay kayıt</p>
              <p className="text-2xl font-bold text-siyah">{thisMonthCount.toLocaleString("tr-TR")}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-siyah/10 bg-beyaz p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-3">
              <MapPin className="h-6 w-6 text-amber-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-siyah/70">Farklı memleket</p>
              <p className="text-2xl font-bold text-siyah">{distinctMemleket.toLocaleString("tr-TR")}</p>
            </div>
          </div>
        </div>
        <div className="flex items-start gap-4 rounded-xl border border-siyah/10 bg-beyaz p-5 shadow-sm sm:col-span-2 lg:col-span-1">
          <AdminTaraftarlarFilter
            arama={arama}
            baslangic={baslangic}
            bitis={bitis}
            memleket={memleket}
            cityOptions={cityOptions}
          />
        </div>
      </div>

      {/* Tablo */}
      <div className="overflow-hidden rounded-xl border border-siyah/10 bg-beyaz shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border border-black/5 text-sm">
            <thead>
              <tr className="bg-siyah/5">
                <th className="border-b p-2 text-left font-semibold text-siyah/80">Ad Soyad</th>
                <th className="border-b p-2 text-left font-semibold text-siyah/80">E-posta</th>
                <th className="border-b p-2 text-left font-semibold text-siyah/80">Memleket</th>
                <th className="border-b p-2 text-left font-semibold text-siyah/80">İkamet</th>
                <th className="border-b p-2 text-center font-semibold text-siyah/80">Puan</th>
                <th className="border-b p-2 text-left font-semibold text-siyah/80">Kayıt</th>
              </tr>
            </thead>
            <tbody>
              {(!profiles || profiles.length === 0) ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-siyah/60">
                    {(arama || baslangic || bitis || memleket) ? "Bu filtrede taraftar bulunamadı." : "Henüz taraftar yok."}
                  </td>
                </tr>
              ) : (
                profiles.map((p) => (
                  <tr key={p.id} className="border-b border-black/5 hover:bg-siyah/[0.02]">
                    <td className="p-2 font-medium text-siyah">{p.first_name} {p.last_name}</td>
                    <td className="p-2 text-siyah/90">{p.email}</td>
                    <td className="p-2">{cityMap.get(p.memleket_city_id) ?? "-"}</td>
                    <td className="p-2">{cityMap.get(p.residence_city_id) ?? "-"}</td>
                    <td className="p-2 text-center">{p.points}</td>
                    <td className="p-2 text-siyah/80">{new Date(p.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
