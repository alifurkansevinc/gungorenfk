import { getAdminSupabase } from "../../actions";
import { Heart, TrendingUp, Calendar } from "lucide-react";
import { AdminBagislarFilter } from "./AdminBagislarFilter";

export default async function AdminBagislarPage({
  searchParams,
}: {
  searchParams: Promise<{ ay?: string }>;
}) {
  const { ay } = await searchParams;
  const supabase = await getAdminSupabase();

  const monthFilter = ay && /^\d{4}-\d{2}$/.test(ay) ? ay : null;
  const startOfMonth = monthFilter ? `${monthFilter}-01T00:00:00Z` : null;
  const endOfMonth = monthFilter
    ? new Date(new Date(startOfMonth!).getFullYear(), new Date(startOfMonth!).getMonth() + 1, 1).toISOString().slice(0, 10) + "T00:00:00Z"
    : null;

  const donationsQuery = supabase
    .from("donations")
    .select("id, amount, payment_status, guest_name, guest_email, user_id, message, created_at, receipt_number")
    .order("created_at", { ascending: false })
    .limit(500);

  if (startOfMonth && endOfMonth) {
    donationsQuery.gte("created_at", startOfMonth).lt("created_at", endOfMonth);
  }

  const { data: donations } = await donationsQuery;

  const userIds = [...new Set((donations ?? []).map((d) => d.user_id).filter(Boolean))] as string[];
  const { data: profiles } = userIds.length
    ? await supabase.from("fan_profiles").select("user_id, first_name, last_name").in("user_id", userIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, `${p.first_name} ${p.last_name}`.trim()]));

  const paidOnly = (donations ?? []).filter((d) => d.payment_status === "PAID");
  const totalFiltered = paidOnly.reduce((s, d) => s + Number(d.amount), 0);

  const { data: sumRows } = await supabase
    .from("donations")
    .select("amount")
    .eq("payment_status", "PAID");
  const totalAll = (sumRows ?? []).reduce((s, r) => s + Number(r.amount), 0);

  const paymentLabel: Record<string, string> = {
    PENDING: "Bekliyor",
    PAID: "Ödendi",
    FAILED: "Başarısız",
    REFUNDED: "İade",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-siyah">Bağışlar</h1>
        <p className="mt-1 text-siyah/70">Yapılan bağışları görüntüleyin.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-siyah/10 bg-beyaz p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-bordo/10 p-3">
              <TrendingUp className="h-6 w-6 text-bordo" />
            </div>
            <div>
              <p className="text-sm font-medium text-siyah/70">
                {monthFilter ? `${monthFilter.slice(0, 4)} ${monthFilter.slice(5)} seçili dönem` : "Tüm zamanlar"}
              </p>
              <p className="text-2xl font-bold text-siyah">
                {totalFiltered.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-siyah/10 bg-beyaz p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-siyah/10 p-3">
              <Heart className="h-6 w-6 text-siyah" />
            </div>
            <div>
              <p className="text-sm font-medium text-siyah/70">Toplam bağış (ödendi)</p>
              <p className="text-2xl font-bold text-siyah">
                {totalAll.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-siyah/10 bg-beyaz p-5 shadow-sm sm:col-span-2 lg:col-span-1">
          <Calendar className="h-8 w-8 text-siyah/50" />
          <AdminBagislarFilter currentAy={monthFilter ?? undefined} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-siyah/10 bg-beyaz shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-siyah/5">
              <tr>
                <th className="px-4 py-3 font-semibold text-siyah/70">Tarih</th>
                <th className="px-4 py-3 font-semibold text-siyah/70">Bağışçı / Üye</th>
                <th className="px-4 py-3 font-semibold text-siyah/70">Tutar</th>
                <th className="px-4 py-3 font-semibold text-siyah/70">Durum</th>
                <th className="px-4 py-3 font-semibold text-siyah/70">Mesaj / Açıklama</th>
                <th className="px-4 py-3 font-semibold text-siyah/70">Makbuz No</th>
              </tr>
            </thead>
            <tbody>
              {(!donations || donations.length === 0) ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-siyah/60">
                    <Heart className="mx-auto mb-4 h-12 w-12 text-siyah/30" />
                    <p>{monthFilter ? "Bu dönemde bağış kaydı yok." : "Henüz bağış kaydı yok."}</p>
                  </td>
                </tr>
              ) : (
                donations.map((d) => (
                  <tr key={d.id} className="border-t border-siyah/5 hover:bg-siyah/[0.02]">
                    <td className="px-4 py-3 text-siyah/80">
                      {new Date(d.created_at).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {d.user_id ? (
                        <div>
                          <p className="font-medium text-siyah">{profileMap.get(d.user_id) || "Üye"}</p>
                          <p className="text-xs text-siyah/60">Üye</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium text-siyah">{d.guest_name || "—"}</p>
                          {d.guest_email && <p className="text-xs text-siyah/60">{d.guest_email}</p>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-bordo">
                      {Number(d.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          d.payment_status === "PAID"
                            ? "bg-green-100 text-green-800"
                            : d.payment_status === "FAILED"
                              ? "bg-red-100 text-red-800"
                              : "bg-siyah/10 text-siyah/80"
                        }`}
                      >
                        {paymentLabel[d.payment_status] ?? d.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-siyah/80">{d.message || "—"}</td>
                    <td className="px-4 py-3 font-mono text-sm text-siyah/80">{d.receipt_number || "—"}</td>
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
