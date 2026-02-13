"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  ExternalLink,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
} from "lucide-react";

type DashboardData = {
  totalOrders: number;
  totalSales: number;
  fansCount: number;
  productsCount: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    total: number;
    status: string;
    paymentStatus: string;
    deliveryMethod: string;
    createdAt: string;
  }>;
};

const statusInfo: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Beklemede", color: "text-yellow-800", bg: "bg-yellow-100" },
  PROCESSING: { label: "Hazırlanıyor", color: "text-blue-800", bg: "bg-blue-100" },
  SHIPPED: { label: "Kargoda", color: "text-indigo-800", bg: "bg-indigo-100" },
  DELIVERED: { label: "Teslim edildi", color: "text-green-800", bg: "bg-green-100" },
  CANCELLED: { label: "İptal", color: "text-red-800", bg: "bg-red-100" },
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(n);
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "Az önce";
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`;
  return date.toLocaleDateString("tr-TR");
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/dashboard", { credentials: "include" });
      const json = await res.json();
      if (json.success && json.data) setData(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-bordo" />
      </div>
    );
  }

  const stats = [
    { title: "Toplam Satış", value: formatPrice(data?.totalSales ?? 0), icon: TrendingUp, color: "bg-green-500" },
    { title: "Siparişler", value: String(data?.totalOrders ?? 0), icon: ShoppingCart, color: "bg-blue-500" },
    { title: "Taraftarlar", value: String(data?.fansCount ?? 0), icon: Users, color: "bg-purple-500" },
    { title: "Mağaza ürünü", value: String(data?.productsCount ?? 0), icon: Package, color: "bg-orange-500" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Hoş geldiniz. Mağaza ve site özeti.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            <ExternalLink className="h-4 w-4" />
            Siteyi Görüntüle
          </Link>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl bg-bordo px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-bordo-dark disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Yenile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Son Siparişler</h2>
          <Link href="/admin/siparisler" className="text-sm font-medium text-bordo hover:underline">
            Tümünü gör →
          </Link>
        </div>
        <div className="overflow-x-auto">
          {data?.recentOrders && data.recentOrders.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-sm text-gray-500">
                  <th className="p-4 font-medium">Sipariş</th>
                  <th className="p-4 font-medium">Müşteri</th>
                  <th className="p-4 font-medium">Tutar</th>
                  <th className="p-4 font-medium">Teslimat</th>
                  <th className="p-4 font-medium">Durum</th>
                  <th className="p-4 font-medium">Zaman</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => {
                  const info = statusInfo[order.status] ?? { label: order.status, color: "text-gray-800", bg: "bg-gray-100" };
                  return (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-4">
                        <Link href={`/admin/siparisler?order=${order.id}`} className="font-medium text-gray-900 hover:text-bordo">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{order.customerName}</td>
                      <td className="p-4 font-semibold text-gray-900">{formatPrice(order.total)}</td>
                      <td className="p-4 text-sm text-gray-500">
                        {order.deliveryMethod === "store_pickup" ? "Mağazadan" : "Kargo"}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${info.bg} ${info.color}`}>
                          {info.label}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-500">{formatTimeAgo(order.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <ShoppingCart className="mb-4 h-12 w-12 text-gray-300" />
              <p>Henüz sipariş yok</p>
              <Link href="/admin/magaza" className="mt-2 text-sm text-bordo hover:underline">
                Mağazaya git
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
