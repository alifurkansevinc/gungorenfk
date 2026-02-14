import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Etkinlikler | Güngören FK",
  description: "Güngören FK etkinlikler ve duyurular.",
};

export default async function HaberlerPage() {
  const supabase = await createClient();
  const { data: news } = await supabase
    .from("news")
    .select("id, title, slug, excerpt, image_url, published_at, event_date, event_time, event_place, event_type")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-siyah sm:text-3xl">Etkinlikler</h1>
      <div className="mt-8 space-y-6">
        {(!news || news.length === 0) ? (
          <p className="text-siyah/60">Henüz etkinlik yok.</p>
        ) : (
          news.map((n) => (
            <Link key={n.id} href={`/haberler/${n.slug}`} className="flex gap-4 rounded-xl border border-black/10 p-4 hover:bg-black/5 transition-colors">
              {n.image_url && (
                <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-lg">
                  <Image src={n.image_url} alt="" fill className="object-cover" unoptimized />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-siyah">{n.title}</h2>
                {n.excerpt && <p className="mt-1 text-sm text-siyah/70 line-clamp-2">{n.excerpt}</p>}
                {n.published_at && <p className="mt-2 text-xs text-siyah/50">{new Date(n.published_at).toLocaleDateString("tr-TR")}</p>}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
