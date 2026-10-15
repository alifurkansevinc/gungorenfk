import Link from "next/link";
import { getAdminSupabase } from "@/app/admin/actions";
import { RequestActions } from "./RequestActions";
import {
  OPEN_SERVICE_STATUSES,
  SERVICE_REQUEST_STATUS_LABELS,
  SERVICE_REQUEST_STATUSES,
  SERVICE_REQUEST_TYPE_LABELS,
  type ServiceRequestStatus,
  type ServiceRequestType,
} from "@/lib/order-service-shared";
import { getSizeLabel } from "@/lib/store-sizes";

type Row = {
  id: string;
  order_id: string;
  order_item_id: string;
  request_type: ServiceRequestType;
  status: ServiceRequestStatus;
  quantity: number;
  from_size: string | null;
  to_size: string | null;
  reason: string | null;
  admin_note: string | null;
  refund_amount: number | null;
  created_at: string;
};

const FILTERS: { key: string; label: string }[] = [
  { key: "acik", label: "Açık" },
  { key: "", label: "Tümü" },
  ...SERVICE_REQUEST_STATUSES.map((status) => ({ key: status, label: SERVICE_REQUEST_STATUS_LABELS[status] })),
];

export default async function AdminTaleplerPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; siparis?: string }>;
}) {
  const { durum = "acik", siparis = "" } = await searchParams;
  const supabase = await getAdminSupabase();
  let query = supabase
    .from("order_service_requests")
    .select("id, order_id, order_item_id, request_type, status, quantity, from_size, to_size, reason, admin_note, refund_amount, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (durum === "acik") query = query.in("status", OPEN_SERVICE_STATUSES);
  else if (SERVICE_REQUEST_STATUSES.includes(durum as ServiceRequestStatus)) query = query.eq("status", durum);

  const { data, error } = await query;
  const requests = (data ?? []) as Row[];
  const orderIds = [...new Set(requests.map((request) => request.order_id))];
  const itemIds = [...new Set(requests.map((request) => request.order_item_id))];

  const [{ data: orders }, { data: items }] = await Promise.all([
    orderIds.length
      ? supabase.from("orders").select("id, order_number, guest_name, guest_email, shipping_address, delivery_method").in("id", orderIds)
      : Promise.resolve({ data: [] }),
    itemIds.length
      ? supabase.from("order_items").select("id, name").in("id", itemIds)
      : Promise.resolve({ data: [] }),
  ]);

  const orderById = new Map(
    (orders ?? []).map((order) => {
      const row = order as {
        id: string;
        order_number: string;
        guest_name: string | null;
        guest_email: string | null;
        shipping_address: { fullName?: string; email?: string } | null;
        delivery_method: string | null;
      };
      return [row.id, row] as const;
    })
  );
  const itemById = new Map((items ?? []).map((item) => [(item as { id: string }).id, (item as { name: string }).name]));
  const orderFilter = siparis.trim().toLowerCase();
  const visible = requests.filter((request) => {
    if (!orderFilter) return true;
    const order = orderById.get(request.order_id);
    return (order?.order_number || "").toLowerCase().includes(orderFilter);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İade ve beden değişimi</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Onayda yeni bedenin stoğu ayrılır. Ürün mağazaya gelince teslim alındı deyin. İade tamamlanınca yalnızca o kalemin tutarı iyzico’dan döner. Kısmi iadede fatura açık kalır.
          </p>
        </div>
        <Link href="/admin/siparisler" className="text-sm font-medium text-bordo hover:underline">
          Siparişlere dön
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = (durum || "") === filter.key;
          const params = new URLSearchParams();
          if (filter.key) params.set("durum", filter.key);
          if (siparis) params.set("siparis", siparis);
          const href = params.size ? `/admin/siparisler/talepler?${params.toString()}` : "/admin/siparisler/talepler";
          return (
            <Link
              key={filter.key || "all"}
              href={href}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${active ? "bg-bordo text-white" : "bg-white text-gray-700 ring-1 ring-gray-200"}`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error.message}</p>}

      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3">Sipariş</th>
              <th className="px-4 py-3">Talep</th>
              <th className="px-4 py-3">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  Bu filtrede talep yok.
                </td>
              </tr>
            )}
            {visible.map((request) => {
              const order = orderById.get(request.order_id);
              const name = order?.shipping_address?.fullName || order?.guest_name || "Müşteri";
              const email = order?.shipping_address?.email || order?.guest_email || "";
              const sizeText =
                request.request_type === "SIZE_EXCHANGE"
                  ? `${getSizeLabel(request.from_size || "")} → ${getSizeLabel(request.to_size || "")}`
                  : getSizeLabel(request.from_size || "");
              return (
                <tr key={request.id} className="border-t border-gray-50 align-top">
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(request.created_at).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900">{order?.order_number}</p>
                    <p className="text-xs text-gray-500">{name}</p>
                    <p className="text-xs text-gray-400">{email}</p>
                    <p className="text-xs text-gray-400">{order?.delivery_method === "store_pickup" ? "Mağaza" : "Kargo"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {SERVICE_REQUEST_TYPE_LABELS[request.request_type]} · {SERVICE_REQUEST_STATUS_LABELS[request.status]}
                    </p>
                    <p className="text-gray-700">{itemById.get(request.order_item_id) || "Ürün"}</p>
                    <p className="text-xs text-gray-500">
                      {request.quantity} adet · {sizeText}
                      {request.refund_amount != null ? ` · ${Number(request.refund_amount).toLocaleString("tr-TR")} ₺` : ""}
                    </p>
                    {request.reason && <p className="mt-1 text-xs text-gray-500">Gerekçe: {request.reason}</p>}
                    {request.admin_note && <p className="text-xs text-gray-400">Not: {request.admin_note}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <RequestActions id={request.id} status={request.status} requestType={request.request_type} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
