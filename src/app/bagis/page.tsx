import Link from "next/link";
import { BagisForm } from "./BagisForm";

export const metadata = {
  title: "Bağış Yap | Güngören FK",
  description: "Güngören FK'ya kredi kartı ile güvenli bağış yapın.",
};

export default async function BagisPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="border-b border-siyah/10 bg-beyaz">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <nav className="text-sm text-siyah/70">
            <Link href="/" className="hover:text-bordo transition-colors">Anasayfa</Link>
            <span className="mx-2">/</span>
            <span className="text-siyah font-medium">Bağış Yap</span>
          </nav>
          <h1 className="font-display mt-3 text-2xl font-bold text-siyah sm:text-3xl">Bağış Yap</h1>
          <p className="mt-1 text-siyah/70">
            Kulübümüze destek ol, zirveye birlikte çıkalım. Aşağıdan tutar seçip <strong>kredi kartı ile bağış</strong> yapabilirsiniz.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <BagisForm />
      </div>
    </div>
  );
}
