import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Ayarlar | Benim Köşem | Güngören FK",
};

export default async function AyarlarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/taraftar/kayit");

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="text-sm text-siyah/70 mb-6">
          <Link href="/benim-kosem" className="hover:text-bordo">Benim Köşem</Link>
          <span className="mx-2">/</span>
          <span className="text-siyah">Ayarlar</span>
        </nav>
        <h1 className="font-display text-2xl font-bold text-siyah">Ayarlar</h1>
        <p className="mt-2 text-siyah/70">Profil ve hesap ayarları yakında burada olacak.</p>
        <Link href="/benim-kosem" className="mt-6 inline-block rounded-lg bg-bordo px-5 py-2.5 font-medium text-beyaz hover:bg-bordo-dark transition-colors">
          ← Benim Köşem’e dön
        </Link>
      </div>
    </div>
  );
}
