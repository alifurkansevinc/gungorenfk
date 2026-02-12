import Link from "next/link";
import { TechnicalStaffForm } from "../TechnicalStaffForm";

export default function AdminTeknikHeyetYeniPage() {
  return (
    <div>
      <Link href="/admin/teknik-heyet" className="text-sm text-bordo hover:underline">← Teknik Heyet</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Yeni üye</h1>
      <TechnicalStaffForm />
    </div>
  );
}
