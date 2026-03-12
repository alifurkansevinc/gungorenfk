"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Eye,
  RefreshCw,
  Loader2,
  Package,
  X,
  CheckCircle,
  Truck,
  XCircle,
  MapPin,
  CreditCard,
  Trash2,
  Printer,
  Calendar,
} from "lucide-react";
import { expireOldPendingOrders, deleteOrder } from "@/app/actions/admin";

type OrderItem = { id: string; name: string; price: number; quantity: number; size?: string | null; image_url?: string | null };
type ShippingAddressRaw = {
  fullName: string;
  address: string;
  neighborhood: string;
  district: string;
  city: string;
  zipCode: string;
  phone: string;
  email: string;
};
type Order = {
  id: string;
  orderNumber: string;
  customer: { name: string; email: string; phone?: string };
  shippingAddress: string;
  shippingAddressRaw?: ShippingAddressRaw;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: string;
  paymentStatus: string;
  deliveryMethod: string;
  pickupDate: string | null;
  pickupCode: string | null;
  createdAt: string;
};

const KARGO_LOGO_URL = "https://rdhqyfsqspcsdugeevon.supabase.co/storage/v1/object/public/Futbolcular/logobordo-02.png";

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Beklemede", color: "text-yellow-800", bg: "bg-yellow-100" },
  PROCESSING: { label: "Hazırlanıyor", color: "text-blue-800", bg: "bg-blue-100" },
  SHIPPED: { label: "Kargoda", color: "text-indigo-800", bg: "bg-indigo-100" },
  DELIVERED: { label: "Teslim edildi", color: "text-green-800", bg: "bg-green-100" },
  CANCELLED: { label: "İptal", color: "text-red-800", bg: "bg-red-100" },
};

const paymentConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Bekliyor", color: "text-yellow-800", bg: "bg-yellow-100" },
  PAID: { label: "Ödendi", color: "text-green-800", bg: "bg-green-100" },
  FAILED: { label: "Başarısız", color: "text-red-800", bg: "bg-red-100" },
  REFUNDED: { label: "İade", color: "text-gray-800", bg: "bg-gray-100" },
};

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 }).format(n);
}

type Summary = {
  total: number;
  byPayment: Record<string, number>;
  totalCiro: number;
  kargoCount: number;
  storePickupCount: number;
};

export default function AdminSiparislerPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusModalOrder, setStatusModalOrder] = useState<Order | null>(null);
  const [notify, setNotify] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("summary", "1");
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (statusFilter) params.set("status", statusFilter);
      if (paymentFilter) params.set("paymentStatus", paymentFilter);
      if (deliveryFilter) params.set("deliveryMethod", deliveryFilter);
      const res = await fetch(`/api/admin/orders?${params.toString()}`, { credentials: "include" });
      const data = await res.json();
      if (data.success && data.data) setOrders(data.data);
      if (data.summary) setSummary(data.summary);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, statusFilter, paymentFilter, deliveryFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await expireOldPendingOrders();
      if (result.expired > 0 && !cancelled) setNotify({ type: "ok", msg: `${result.expired} adet bekleyen sipariş silindi.` });
      if (!cancelled) await fetchOrders();
    })();
    return () => { cancelled = true; };
  }, [fetchOrders]);

  const showNotify = (type: "ok" | "err", msg: string) => {
    setNotify({ type, msg });
    setTimeout(() => setNotify(null), 3000);
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    const matchPayment = !paymentFilter || o.paymentStatus === paymentFilter;
    return matchSearch && matchStatus && matchPayment;
  });

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setUpdating(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: orderId, status }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
        if (selected?.id === orderId) setSelected((s) => (s ? { ...s, status } : null));
        showNotify("ok", "Durum güncellendi.");
      } else showNotify("err", data.error || "Güncellenemedi.");
    } catch {
      showNotify("err", "İstek hatası.");
    } finally {
      setUpdating(false);
      setStatusModalOrder(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.paymentStatus === "PAID") {
      showNotify("err", "Ödenen sipariş silinemez.");
      return;
    }
    setUpdating(true);
    setStatusModalOrder(null);
    try {
      const result = await deleteOrder(orderId);
      if ("ok" in result && result.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        if (selected?.id === orderId) setModalOpen(false);
        showNotify("ok", "Sipariş silindi.");
        await fetchOrders();
      } else showNotify("err", "error" in result ? result.error : "Silinemedi.");
    } catch {
      showNotify("err", "İstek hatası.");
    } finally {
      setUpdating(false);
    }
  };

  const escapeHtml = (s: string) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const printKargoEtiketi = (order: Order) => {
    if (order.deliveryMethod !== "shipping") return;
    const raw = order.shippingAddressRaw;
    const orderNo = escapeHtml(order.orderNumber);
    const name = escapeHtml(order.customer.name || (raw?.fullName ?? ""));
    const phone = escapeHtml(order.customer.phone || raw?.phone || "");
    const email = escapeHtml(order.customer.email || raw?.email || "");
    const addrLine1 = raw?.address ? escapeHtml(raw.address) : "";
    const addrLine2 = [raw?.neighborhood, raw?.district].filter(Boolean).join(", ");
    const cityZip = [raw?.city, raw?.zipCode].filter(Boolean).join(" ");
    const addrFallback = order.shippingAddress || "—";
    const senderName = "Güngören Belediyesi Spor Kulübü";
    const senderAddr = "Güngören Spor Kompleksi, Güngören";

    const itemsHtml = (order.items || [])
      .map(
        (it) => {
          const iname = escapeHtml(it.name);
          const qty = it.quantity || 1;
          const sz = it.size && it.size !== "tek_beden" ? escapeHtml(it.size) : "";
          const img = it.image_url ? `<img src="${escapeHtml(it.image_url)}" alt="" class="item-img" />` : "";
          return `<tr><td class="item-cell">${img}<div class="item-info"><strong>${iname}</strong>${sz ? ` · ${sz}` : ""} <span class="qty">×${qty}</span></div></td></tr>`;
        }
      )
      .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Kargo etiketi - ${orderNo}</title>
<style>
  @page { size: A5; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; margin: 0; padding: 12px; font-size: 11px; color: #1a1a1a; }
  .page { width: 148mm; min-height: 210mm; padding: 10px; }
  .logo { height: 36px; object-fit: contain; object-position: left; margin-bottom: 14px; }
  .code { font-size: 16px; font-weight: 800; letter-spacing: 0.05em; color: #8B1538; margin-bottom: 12px; border-bottom: 2px solid #8B1538; padding-bottom: 6px; }
  .block { margin-bottom: 14px; }
  .block-title { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #666; margin-bottom: 4px; }
  .sender { color: #333; line-height: 1.4; }
  .receiver { line-height: 1.5; }
  .receiver .name { font-weight: 700; font-size: 12px; }
  .receiver .addr { margin: 2px 0; }
  .receiver .contact { margin-top: 4px; color: #555; font-size: 10px; }
  table.items { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
  .item-cell { padding: 6px 0; border-bottom: 1px solid #eee; vertical-align: middle; }
  .item-cell .item-img { width: 32px; height: 32px; object-fit: contain; border-radius: 4px; margin-right: 8px; vertical-align: middle; display: inline-block; }
  .item-cell .item-info { display: inline-block; vertical-align: middle; max-width: calc(100% - 44px); }
  .qty { color: #8B1538; font-weight: 600; }
  .hint { margin-top: 12px; font-size: 10px; color: #888; }
  @media print { body { padding: 0; } .page { box-shadow: none; min-height: auto; } }
</style></head><body>
<div class="page">
  <img src="${KARGO_LOGO_URL}" alt="Güngören FK" class="logo" />
  <div class="code">Sipariş kodu: ${orderNo}</div>
  <div class="block">
    <div class="block-title">Gönderici</div>
    <div class="sender">${escapeHtml(senderName)}<br/>${escapeHtml(senderAddr)}</div>
  </div>
  <div class="block">
    <div class="block-title">Alıcı</div>
    <div class="receiver">
      <div class="name">${name}</div>
      <div class="addr">${addrLine1 || escapeHtml(addrFallback)}</div>
      ${addrLine2 ? `<div class="addr">${escapeHtml(addrLine2)}</div>` : ""}
      ${cityZip ? `<div class="addr">${escapeHtml(cityZip)}</div>` : ""}
      <div class="contact">${phone ? "Tel: " + phone : ""}${phone && email ? " · " : ""}${email ? "E-posta: " + email : ""}</div>
    </div>
  </div>
  <div class="block">
    <div class="block-title">Ürünler</div>
    <table class="items"><tbody>${itemsHtml || "<tr><td>—</td></tr>"}</tbody></table>
  </div>
  <p class="hint">Yazdır (Ctrl+P) veya PDF olarak kaydet · A5</p>
</div>
</body></html>`;
    const win = window.open("", "_blank");
    if (!win) {
      showNotify("err", "Popup engellendi. Lütfen tarayıcıda açılır pencerelere izin verin.");
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 500);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-bordo" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notify && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl px-6 py-4 shadow-lg ${
            notify.type === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {notify.type === "ok" ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          {notify.msg}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Siparişler</h1>
          <p className="text-gray-500">Tüm siparişleri görüntüleyin ve yönetin. Ödenen sipariş silinemez; bekleyenler 3 gün sonra otomatik silinir.</p>
        </div>
        <button
          type="button"
          onClick={() => fetchOrders()}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Yenile
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-bordo/20 bg-bordo/5 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-bordo/80">Toplam ciro</p>
            <p className="text-xl font-bold text-bordo sm:text-2xl">{formatPrice(summary.totalCiro ?? 0)}</p>
          </div>
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-indigo-700">Kargo edilecek</p>
            <p className="text-2xl font-bold text-indigo-800">{summary.kargoCount ?? 0}</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-amber-700">Mağazadan teslim</p>
            <p className="text-2xl font-bold text-amber-800">{summary.storePickupCount ?? 0}</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-gray-500">Toplam sipariş</p>
            <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
          </div>
          <div className="rounded-xl border border-green-100 bg-green-50/50 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-green-700">Ödendi</p>
            <p className="text-2xl font-bold text-green-800">{summary.byPayment.PAID ?? 0}</p>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50/50 p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-red-700">Başarısız</p>
            <p className="text-2xl font-bold text-red-800">{summary.byPayment.FAILED ?? 0}</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-gray-600 mb-3">
          <Calendar className="h-5 w-5" />
          <span className="text-sm font-medium">Filtreler</span>
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Sipariş no veya müşteri ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-bordo focus:outline-none"
            />
            <span className="text-gray-400">–</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-bordo focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-bordo focus:outline-none"
            >
              <option value="">Tüm durumlar</option>
              {Object.entries(statusConfig).map(([v, { label }]) => (
                <option key={v} value={v}>{label}</option>
              ))}
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-bordo focus:outline-none"
            >
              <option value="">Ödeme</option>
              <option value="PAID">Ödendi</option>
              <option value="PENDING">Bekliyor</option>
              <option value="FAILED">Başarısız</option>
            </select>
            <select
              value={deliveryFilter}
              onChange={(e) => setDeliveryFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-bordo focus:outline-none"
            >
              <option value="">Teslimat</option>
              <option value="shipping">Kargo</option>
              <option value="store_pickup">Mağazadan</option>
            </select>
            {(startDate || endDate || statusFilter || paymentFilter || deliveryFilter) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setStatusFilter("");
                  setPaymentFilter("");
                  setDeliveryFilter("");
                }}
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Filtreleri temizle
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-sm text-gray-500">
                <th className="p-4 font-medium">Sipariş</th>
                <th className="p-4 font-medium">Müşteri</th>
                <th className="p-4 font-medium">Tarih</th>
                <th className="p-4 font-medium">Tutar</th>
                <th className="p-4 font-medium">Teslimat</th>
                <th className="p-4 font-medium">Ödeme</th>
                <th className="p-4 font-medium">Durum</th>
                <th className="p-4 font-medium w-24">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-500">
                    <Package className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                    <p>{orders.length === 0 ? "Henüz sipariş yok." : "Filtreye uygun sipariş yok."}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const st = statusConfig[order.status] ?? { label: order.status, bg: "bg-gray-100", color: "text-gray-800" };
                  const pt = paymentConfig[order.paymentStatus] ?? { label: order.paymentStatus, bg: "bg-gray-100", color: "text-gray-800" };
                  return (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-4 font-mono text-sm font-medium text-bordo">{order.orderNumber}</td>
                      <td className="p-4">
                        <p className="font-medium text-gray-900">{order.customer.name}</p>
                        <p className="text-xs text-gray-500">{order.customer.email}</p>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
                      <td className="p-4 font-semibold text-gray-900">{formatPrice(order.total)}</td>
                      <td className="p-4 text-sm text-gray-600">
                        {order.deliveryMethod === "store_pickup" ? "Mağazadan" : "Kargo"}
                      </td>
                      <td className="p-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${pt.bg} ${pt.color}`}>
                          {pt.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${st.bg} ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelected(order);
                              setModalOpen(true);
                            }}
                            className="rounded-lg p-2 hover:bg-gray-100"
                            title="Detay"
                          >
                            <Eye className="h-5 w-5 text-gray-500" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatusModalOrder(order)}
                            className="rounded-lg px-2.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 border border-gray-200"
                            title="Durum güncelle"
                          >
                            Durum
                          </button>
                          {order.deliveryMethod === "shipping" && order.paymentStatus === "PAID" && (
                            <button
                              type="button"
                              onClick={() => printKargoEtiketi(order)}
                              className="rounded-lg p-2 hover:bg-indigo-50 text-indigo-600"
                              title="Kargo etiketi yazdır"
                            >
                              <Printer className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detay modal */}
      {modalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white p-6">
              <h2 className="text-xl font-bold text-gray-900">Sipariş {selected.orderNumber}</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 hover:bg-gray-100"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-6 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <CreditCard className="h-4 w-4" /> Müşteri
                  </h3>
                  <p className="font-medium text-gray-900">{selected.customer.name}</p>
                  <p className="text-sm text-gray-600">{selected.customer.email}</p>
                  {selected.customer.phone && (
                    <p className="text-sm text-gray-600">{selected.customer.phone}</p>
                  )}
                </div>
                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <MapPin className="h-4 w-4" /> Teslimat
                  </h3>
                  <p className="text-sm text-gray-600">{selected.shippingAddress || "—"}</p>
                  {selected.deliveryMethod === "store_pickup" && (
                    <div className="mt-2 rounded-lg bg-bordo/10 p-3 text-sm">
                      <p className="font-medium text-bordo">Mağazadan teslim</p>
                      {selected.pickupDate && (
                        <p>Tarih: {new Date(selected.pickupDate + "T12:00:00").toLocaleDateString("tr-TR")}</p>
                      )}
                      {selected.pickupCode && (
                        <p className="font-mono font-bold">Kod: {selected.pickupCode}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-700">Ürünler</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-gray-500">
                      <th className="pb-2 font-medium w-14">Görsel</th>
                      <th className="pb-2 font-medium">Ürün</th>
                      <th className="pb-2 text-center font-medium">Adet</th>
                      <th className="pb-2 text-right font-medium">Fiyat</th>
                      <th className="pb-2 text-right font-medium">Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-50">
                        <td className="py-2">
                          {item.image_url ? (
                            <img src={item.image_url} alt="" className="h-12 w-12 rounded-lg object-cover border border-gray-100" />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">—</div>
                          )}
                        </td>
                        <td className="py-2 text-gray-900">
                          {item.name}
                          {item.size && <span className="ml-1 text-xs text-gray-500">(Beden: {item.size})</span>}
                        </td>
                        <td className="py-2 text-center">{item.quantity}</td>
                        <td className="py-2 text-right">{formatPrice(item.price)}</td>
                        <td className="py-2 text-right font-medium">{formatPrice(item.price * item.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 flex justify-end gap-4 border-t border-gray-100 pt-4 text-sm">
                  {selected.shippingCost > 0 && (
                    <span className="text-gray-600">Kargo: {formatPrice(selected.shippingCost)}</span>
                  )}
                  <span className="font-bold text-gray-900">Toplam: {formatPrice(selected.total)}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${paymentConfig[selected.paymentStatus]?.bg} ${paymentConfig[selected.paymentStatus]?.color}`}>
                  {paymentConfig[selected.paymentStatus]?.label ?? selected.paymentStatus}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusConfig[selected.status]?.bg} ${statusConfig[selected.status]?.color}`}>
                  {statusConfig[selected.status]?.label ?? selected.status}
                </span>
                {selected.deliveryMethod === "shipping" && (
                  <button
                    type="button"
                    onClick={() => printKargoEtiketi(selected)}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Printer className="h-4 w-4" />
                    Kargo etiketi yazdır
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Durum güncelle modal — ortada, dropdown yerine */}
      {statusModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setStatusModalOrder(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Durum güncelle · {statusModalOrder.orderNumber}</h3>
            <div className="flex flex-col gap-2">
              {(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={statusModalOrder.status === status || updating}
                  onClick={() => handleUpdateStatus(statusModalOrder.id, status)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${statusModalOrder.status === status ? "border-bordo bg-bordo/10 text-bordo cursor-default" : "border-gray-200 hover:bg-gray-50"}`}
                >
                  {statusConfig[status].label}
                </button>
              ))}
              {statusModalOrder.paymentStatus === "FAILED" && (
                <>
                  <div className="my-2 border-t border-gray-100" />
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleDeleteOrder(statusModalOrder.id)}
                    className="rounded-xl border border-red-200 px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="mr-2 inline h-4 w-4" />
                    Siparişi sil
                  </button>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setStatusModalOrder(null)}
              className="mt-4 w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
