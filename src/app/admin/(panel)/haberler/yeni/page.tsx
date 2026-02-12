import Link from "next/link";
import { HaberFormu } from "../HaberFormu";

export default function AdminHaberlerYeniPage() {
  return (
    <div>
      <Link href="/admin/haberler" className="text-sm text-bordo hover:underline">← Gelişmeler listesi</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Yeni haber</h1>
      <HaberFormu />
    </div>
  );
}
