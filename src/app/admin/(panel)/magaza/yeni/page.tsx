import Link from "next/link";
import { UrunFormu } from "../UrunFormu";
import { ArrowLeft } from "lucide-react";

export default function AdminMagazaYeniPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/magaza"
        className="inline-flex items-center gap-2 text-sm font-medium text-bordo hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Mağaza listesi
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Yeni ürün</h1>
        <p className="mt-1 text-gray-500">Ürün bilgilerini girin.</p>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <UrunFormu />
      </div>
    </div>
  );
}
