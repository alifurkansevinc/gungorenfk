import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BagisForm } from "./BagisForm";

export const metadata = {
  title: "Bağış Yap | Güngören FK",
  description: "Güngören FK'ya bağış yapın. Kart veya havale ile destek olun.",
};

export default async function BagisPage() {
  const supabase = await createClient();
  const { data: row } = await supabase.from("site_settings").select("value").eq("key", "donation_iban").single();
  const ibanSettings = (row?.value as { title?: string; iban?: string; accountName?: string }) ?? null;

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
            Kulübümüze destek olmak için aşağıdan tutar seçip güvenli ödeme (iyzico) ile bağış yapabilir veya havale/EFT bilgilerimizi kullanabilirsiniz.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <BagisForm />

        {ibanSettings?.iban && (
          <div className="mt-10 rounded-2xl border border-siyah/10 bg-beyaz p-6">
            <h2 className="font-display text-lg font-bold text-siyah">
              {ibanSettings.title ?? "Havale / EFT ile bağış"}
            </h2>
            <p className="mt-2 text-sm text-siyah/70">
              Aşağıdaki hesaba havale veya EFT yaparak da bağış yapabilirsiniz. Açıklama kısmına &quot;Bağış&quot; yazmanız yeterlidir.
            </p>
            <div className="mt-4 rounded-xl bg-siyah/5 p-4 font-mono text-siyah">
              <p className="text-sm text-siyah/60">IBAN</p>
              <p className="mt-1 break-all font-semibold">{ibanSettings.iban}</p>
              {ibanSettings.accountName && (
                <>
                  <p className="mt-3 text-sm text-siyah/60">Hesap adı</p>
                  <p className="mt-1 font-semibold">{ibanSettings.accountName}</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
