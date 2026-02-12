import Link from "next/link";
import { MacForm } from "../MacForm";

export default function AdminMaclarYeniPage() {
  return (
    <div>
      <Link href="/admin/maclar" className="text-sm text-bordo hover:underline">← Maç listesi</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Yeni maç</h1>
      <MacForm />
    </div>
  );
}
