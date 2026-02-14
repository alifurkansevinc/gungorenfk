import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = {
  title: "Galeri | Güngören FK",
  description: "Güngören FK fotoğraf galerileri.",
};

const PLACEHOLDER_IMAGE = "https://placehold.co/800x500/0A0A0A/8B1538?text=Güngören+FK";

export default async function GaleriPage() {
  const supabase = await createClient();
  const { data: galleries } = await supabase
    .from("galleries")
    .select("id, title, slug, event_date")
    .order("event_date", { ascending: false });

  const ids = (galleries ?? []).map((g) => g.id);
  const covers: Record<string, string> = {};
  if (ids.length > 0) {
    const { data: photos } = await supabase
      .from("gallery_photos")
      .select("gallery_id, image_url")
      .in("gallery_id", ids)
      .order("sort_order");
    const seen = new Set<string>();
    for (const p of photos ?? []) {
      if (!seen.has(p.gallery_id)) {
        seen.add(p.gallery_id);
        covers[p.gallery_id] = p.image_url;
      }
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-12 text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight text-siyah sm:text-4xl">Galeri</h1>
        <p className="mt-2 text-siyah/70">Maç ve etkinlik fotoğraflarımız</p>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(!galleries || galleries.length === 0) ? (
          <p className="col-span-full rounded-2xl border border-siyah/10 bg-siyah/5 py-12 text-center text-siyah/60">Henüz galeri yok.</p>
        ) : (
          galleries.map((g) => {
            const cover = covers[g.id] ?? PLACEHOLDER_IMAGE;
            return (
              <Link
                key={g.id}
                href={`/galeri/${g.slug}`}
                className="group block overflow-hidden rounded-2xl border border-siyah/10 bg-beyaz shadow-sm transition-all duration-300 hover:border-bordo/30 hover:shadow-lg"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-siyah/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cover}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h2 className="font-display text-lg font-semibold text-siyah group-hover:text-bordo transition-colors">{g.title}</h2>
                  {g.event_date && (
                    <p className="mt-1 text-sm text-siyah/70">{new Date(g.event_date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</p>
                  )}
                  <span className="mt-2 inline-block text-sm font-medium text-bordo group-hover:underline">Galeriyi görüntüle →</span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
