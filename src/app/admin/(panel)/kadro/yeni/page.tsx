import Link from "next/link";
import { SquadForm } from "../SquadForm";

export default function AdminKadroYeniPage() {
  return (
    <div>
      <Link href="/admin/kadro" className="text-sm text-bordo hover:underline">← Kadro listesi</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Yeni oyuncu</h1>
      <SquadForm />
    </div>
  );
}
