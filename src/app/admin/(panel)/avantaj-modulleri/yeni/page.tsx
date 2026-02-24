import Link from "next/link";
import { AvantajModuluFormu } from "../AvantajModuluFormu";

export default function AdminAvantajModuluYeniPage() {
  return (
    <div>
      <Link href="/admin/avantaj-modulleri" className="text-sm text-bordo hover:underline">← Avantaj modülleri</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Yeni avantaj modülü</h1>
      <AvantajModuluFormu />
    </div>
  );
}
