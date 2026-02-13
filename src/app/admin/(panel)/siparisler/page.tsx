"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Eye,
  RefreshCw,
  Loader2,
  Package,
  X,
  ChevronDown,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  MapPin,
  CreditCard,
} from "lucide-react";

type OrderItem = { id: string; name: string; price: number; quantity: number };
type Order = {
  id: string;
  orderNumber: string;
  customer: { name: string; email: string; phone?: string };
  shippingAddress: string;
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

export default function AdminSiparislerPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownId, setDropdownId] = useState<string | null>(null);
  const [notify, setNotify] = useState<{ type: "ok" | "err"; msg: string } | null>(null);
  const [updating, setUpdating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const res = await fetch(`/api/admin/orders?${params.toString()}`, { credentials: "include" });
      const data = await res.json();
      if (data.success && data.data) setOrders(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownId(null);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

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
      setDropdownId(null);
    }
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
          <p className="text-gray-500">Tüm siparişleri görüntüleyin ve yönetin</p>
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

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Sipariş no veya müşteri ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 focus:border-bordo focus:outline-none focus:ring-1 focus:ring-bordo"
            />
          </div>
          <div className="flex flex-wrap gap-2">
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
                      <td className="p-4" ref={dropdownId === order.id ? dropdownRef : null}>
                        <div className="relative flex items-center gap-1">
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
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setDropdownId(dropdownId === order.id ? null : order.id)}
                              className="rounded-lg p-2 hover:bg-gray-100"
                              title="Durum"
                            >
                              <ChevronDown className="h-5 w-5 text-gray-500" />
                            </button>
                            {dropdownId === order.id && (
                              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-gray-100 bg-white py-2 shadow-xl">
                                <p className="border-b border-gray-100 px-3 py-2 text-xs font-medium uppercase text-gray-400">
                                  Durum güncelle
                                </p>
                                {(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const).map(
                                  (status) => (
                                    <button
                                      key={status}
                                      type="button"
                                      disabled={order.status === status || updating}
                                      onClick={() => handleUpdateStatus(order.id, status)}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50"
                                    >
                                      {statusConfig[status].label}
                                    </button>
                                  )
                                )}
                              </div>
                            )}
                          </div>
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
                      <th className="pb-2 font-medium">Ürün</th>
                      <th className="pb-2 text-center font-medium">Adet</th>
                      <th className="pb-2 text-right font-medium">Fiyat</th>
                      <th className="pb-2 text-right font-medium">Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-50">
                        <td className="py-2 text-gray-900">{item.name}</td>
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
              <div className="flex gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${paymentConfig[selected.paymentStatus]?.bg} ${paymentConfig[selected.paymentStatus]?.color}`}>
                  {paymentConfig[selected.paymentStatus]?.label ?? selected.paymentStatus}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusConfig[selected.status]?.bg} ${statusConfig[selected.status]?.color}`}>
                  {statusConfig[selected.status]?.label ?? selected.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
