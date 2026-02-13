import { getAdminSupabase } from "../../actions";
import { Heart } from "lucide-react";

export default async function AdminBagislarPage() {
  const supabase = await getAdminSupabase();
  const { data: donations } = await supabase
    .from("donations")
    .select("id, amount, payment_status, guest_name, guest_email, user_id, message, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const paymentLabel: Record<string, string> = {
    PENDING: "Bekliyor",
    PAID: "Ödendi",
    FAILED: "Başarısız",
    REFUNDED: "İade",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bağışlar</h1>
        <p className="mt-1 text-gray-500">Yapılan bağışları görüntüleyin.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-sm text-gray-500">
                <th className="p-4 font-medium">Tarih</th>
                <th className="p-4 font-medium">Bağışçı</th>
                <th className="p-4 font-medium">Tutar</th>
                <th className="p-4 font-medium">Durum</th>
                <th className="p-4 font-medium">Mesaj</th>
              </tr>
            </thead>
            <tbody>
              {(!donations || donations.length === 0) ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    <Heart className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                    <p>Henüz bağış kaydı yok.</p>
                  </td>
                </tr>
              ) : (
                donations.map((d) => (
                  <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-4 text-sm text-gray-600">
                      {new Date(d.created_at).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-4">
                      {d.user_id ? (
                        <span className="text-gray-900">Üye</span>
                      ) : (
                        <div>
                          <p className="font-medium text-gray-900">{d.guest_name || "—"}</p>
                          {d.guest_email && <p className="text-xs text-gray-500">{d.guest_email}</p>}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-bordo">
                      {Number(d.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          d.payment_status === "PAID"
                            ? "bg-green-100 text-green-800"
                            : d.payment_status === "FAILED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {paymentLabel[d.payment_status] ?? d.payment_status}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs truncate text-sm text-gray-600">{d.message || "—"}</td>
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
