import Link from "next/link";
import { TrophyForm } from "../TrophyForm";

export default function AdminKupaMuzesiYeniPage() {
  return (
    <div>
      <Link href="/admin/kupa-muzesi" className="text-sm text-bordo hover:underline">← Kupa Müzesi</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Yeni kupa ekle</h1>
      <TrophyForm />
    </div>
  );
}
