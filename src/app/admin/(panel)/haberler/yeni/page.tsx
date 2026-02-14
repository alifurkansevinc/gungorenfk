import Link from "next/link";
import { HaberFormu } from "../HaberFormu";

export default function AdminHaberlerYeniPage() {
  return (
    <div>
      <Link href="/admin/haberler" className="text-sm text-bordo hover:underline">← Etkinlikler listesi</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Yeni etkinlik</h1>
      <HaberFormu />
    </div>
  );
}
