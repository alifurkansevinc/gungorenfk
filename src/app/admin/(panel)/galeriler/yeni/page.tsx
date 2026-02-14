import Link from "next/link";
import { GaleriFormu } from "../GaleriFormu";

export default function AdminGaleriYeniPage() {
  return (
    <div>
      <Link href="/admin/galeriler" className="text-sm text-bordo hover:underline">← Galeriler listesi</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Yeni galeri</h1>
      <GaleriFormu />
    </div>
  );
}
