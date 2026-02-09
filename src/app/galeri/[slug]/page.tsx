import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";

export default async function GaleriDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: gallery } = await supabase.from("galleries").select("*").eq("slug", slug).single();
  if (!gallery) notFound();
  const { data: photos } = await supabase.from("gallery_photos").select("*").eq("gallery_id", gallery.id).order("sort_order");

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-siyah">{gallery.title}</h1>
      {gallery.event_date && <p className="mt-1 text-siyah/70">{new Date(gallery.event_date).toLocaleDateString("tr-TR")}</p>}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {(!photos || photos.length === 0) ? (
          <p className="col-span-full text-siyah/60">Henüz fotoğraf yok.</p>
        ) : (
          photos.map((p) => (
            <div key={p.id} className="relative aspect-square overflow-hidden rounded-lg">
              <Image src={p.image_url} alt={p.caption ?? ""} fill className="object-cover" unoptimized />
              {p.caption && <p className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-sm text-beyaz">{p.caption}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
