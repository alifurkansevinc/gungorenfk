import Link from "next/link";
import { UrunFormu } from "../UrunFormu";

export default function AdminMagazaYeniPage() {
  return (
    <div>
      <Link href="/admin/magaza" className="text-sm text-bordo hover:underline">← Mağaza listesi</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Yeni ürün</h1>
      <UrunFormu />
    </div>
  );
}
