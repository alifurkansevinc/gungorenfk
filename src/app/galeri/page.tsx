import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = {
  title: "Galeri | Güngören FK",
  description: "Güngören FK fotoğraf galerileri.",
};

export default async function GaleriPage() {
  const supabase = await createClient();
  const { data: galleries } = await supabase
    .from("galleries")
    .select("id, title, slug, event_date")
    .order("event_date", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-siyah sm:text-3xl">Galeri</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {(!galleries || galleries.length === 0) ? (
          <p className="col-span-full text-siyah/60">Henüz galeri yok.</p>
        ) : (
          galleries.map((g) => (
            <Link key={g.id} href={`/galeri/${g.slug}`} className="rounded-xl border border-black/10 p-4 hover:bg-black/5 transition-colors">
              <h2 className="font-semibold text-siyah">{g.title}</h2>
              {g.event_date && <p className="mt-1 text-sm text-siyah/70">{new Date(g.event_date).toLocaleDateString("tr-TR")}</p>}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
