import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { hasValidBypass } from "../actions";

export default async function AdminPanelLayout({
  children,
}: { children: React.ReactNode }) {
  const bypass = await hasValidBypass();
  if (bypass) {
    return (
      <div className="min-h-screen bg-siyah/5">
        <nav className="border-b border-black/10 bg-beyaz px-4 py-3">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4">
            <Link href="/admin" className="font-bold text-bordo">Admin</Link>
            <Link href="/admin" className="text-sm text-siyah/80 hover:text-bordo">Dashboard</Link>
            <Link href="/admin/taraftarlar" className="text-sm text-siyah/80 hover:text-bordo">Taraftarlar</Link>
            <Link href="/admin/maclar" className="text-sm text-siyah/80 hover:text-bordo">Maçlar</Link>
            <Link href="/admin/kadro" className="text-sm text-siyah/80 hover:text-bordo">Kadro</Link>
            <Link href="/admin/haberler" className="text-sm text-siyah/80 hover:text-bordo">Gelişmeler</Link>
            <Link href="/admin/yonetim-kurulu" className="text-sm text-siyah/80 hover:text-bordo">Yönetim Kurulu</Link>
            <Link href="/admin/teknik-heyet" className="text-sm text-siyah/80 hover:text-bordo">Teknik Heyet</Link>
            <Link href="/admin/rozet" className="text-sm text-siyah/80 hover:text-bordo">Rozet Kuralları</Link>
            <Link href="/admin/magaza" className="text-sm text-siyah/80 hover:text-bordo">Mağaza</Link>
            <span className="text-xs text-siyah/50">(bypass)</span>
            <Link href="/" className="text-sm text-siyah/60 hover:text-siyah">Siteye Dön</Link>
          </div>
        </nav>
        <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
      </div>
    );
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/giris");
  const { data: adminRow } = await supabase.from("admin_users").select("id").eq("user_id", user.id).single();
  if (!adminRow) redirect("/admin/giris");

  return (
    <div className="min-h-screen bg-siyah/5">
      <nav className="border-b border-black/10 bg-beyaz px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4">
          <Link href="/admin" className="font-bold text-bordo">Admin</Link>
          <Link href="/admin" className="text-sm text-siyah/80 hover:text-bordo">Dashboard</Link>
          <Link href="/admin/taraftarlar" className="text-sm text-siyah/80 hover:text-bordo">Taraftarlar</Link>
          <Link href="/admin/maclar" className="text-sm text-siyah/80 hover:text-bordo">Maçlar</Link>
          <Link href="/admin/kadro" className="text-sm text-siyah/80 hover:text-bordo">Kadro</Link>
          <Link href="/admin/haberler" className="text-sm text-siyah/80 hover:text-bordo">Gelişmeler</Link>
          <Link href="/admin/yonetim-kurulu" className="text-sm text-siyah/80 hover:text-bordo">Yönetim Kurulu</Link>
          <Link href="/admin/teknik-heyet" className="text-sm text-siyah/80 hover:text-bordo">Teknik Heyet</Link>
          <Link href="/admin/rozet" className="text-sm text-siyah/80 hover:text-bordo">Rozet Kuralları</Link>
          <Link href="/admin/magaza" className="text-sm text-siyah/80 hover:text-bordo">Mağaza</Link>
          <Link href="/" className="text-sm text-siyah/60 hover:text-siyah">Siteye Dön</Link>
        </div>
      </nav>
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
