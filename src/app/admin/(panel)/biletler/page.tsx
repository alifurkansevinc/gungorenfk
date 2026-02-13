import { getAdminSupabase } from "../../actions";
import { Ticket } from "lucide-react";

export default async function AdminBiletlerPage() {
  const supabase = await getAdminSupabase();
  const { data: tickets } = await supabase
    .from("match_tickets")
    .select("id, match_id, qr_code, status, payment_status, guest_name, guest_email, user_id, used_at, created_at, matches(opponent_name, match_date, venue)")
    .order("created_at", { ascending: false })
    .limit(300);

  const matchInfo = (t: { matches?: { opponent_name?: string; match_date?: string; venue?: string } | null }) => {
    const m = t.matches;
    if (!m) return "—";
    const date = m.match_date
      ? new Date(m.match_date + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })
      : "";
    return `Güngören FK - ${m.opponent_name ?? "?"} ${date}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Biletler</h1>
        <p className="mt-1 text-gray-500">Satılan maç biletleri ve kullanım durumu.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-sm text-gray-500">
                <th className="p-4 font-medium">Tarih</th>
                <th className="p-4 font-medium">Maç</th>
                <th className="p-4 font-medium">Alıcı</th>
                <th className="p-4 font-medium">QR Kod</th>
                <th className="p-4 font-medium">Ödeme</th>
                <th className="p-4 font-medium">Durum</th>
                <th className="p-4 font-medium">Kullanım</th>
              </tr>
            </thead>
            <tbody>
              {(!tickets || tickets.length === 0) ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-gray-500">
                    <Ticket className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                    <p>Henüz bilet kaydı yok.</p>
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(t.created_at).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-4 text-sm text-gray-900 max-w-[200px]">
                      {matchInfo(t as { matches?: { opponent_name?: string; match_date?: string; venue?: string } | null })}
                    </td>
                    <td className="p-4">
                      {t.user_id ? (
                        <span className="text-gray-900">Üye</span>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-gray-900">{t.guest_name || "—"}</p>
                          {t.guest_email && <p className="text-xs text-gray-500">{t.guest_email}</p>}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-mono text-sm text-bordo">{t.qr_code}</td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          (t as { payment_status?: string }).payment_status === "PAID"
                            ? "bg-green-100 text-green-800"
                            : (t as { payment_status?: string }).payment_status === "FAILED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {(t as { payment_status?: string }).payment_status === "PAID" ? "Ödendi" : (t as { payment_status?: string }).payment_status === "FAILED" ? "Başarısız" : "Bekliyor"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          t.status === "used"
                            ? "bg-gray-200 text-gray-700"
                            : t.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {t.status === "used" ? "Kullanıldı" : t.status === "cancelled" ? "İptal" : "Aktif"}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {t.used_at
                        ? new Date(t.used_at).toLocaleDateString("tr-TR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
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
