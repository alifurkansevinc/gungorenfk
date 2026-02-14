import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/app/admin/actions";
import { GaleriFormu } from "../../GaleriFormu";
import { GaleriFotoFormu } from "../../GaleriFotoFormu";
import { GaleriFotoSilButton } from "../../GaleriFotoSilButton";

export default async function AdminGaleriDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await getAdminSupabase();
  const { data: gallery } = await supabase.from("galleries").select("*").eq("id", id).single();
  if (!gallery) notFound();
  const { data: photos } = await supabase.from("gallery_photos").select("*").eq("gallery_id", id).order("sort_order");

  return (
    <div>
      <Link href="/admin/galeriler" className="text-sm text-bordo hover:underline">← Galeriler listesi</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Galeriyi düzenle</h1>
      <GaleriFormu gallery={gallery} />
      <section className="mt-10 border-t border-siyah/10 pt-8">
        <h2 className="text-lg font-semibold text-siyah">Fotoğraflar</h2>
        <GaleriFotoFormu galleryId={id} />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(!photos || photos.length === 0) ? (
            <p className="col-span-full text-sm text-siyah/60">Henüz fotoğraf yok. Yukarıdan URL ile ekleyin.</p>
          ) : (
            photos.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-lg border border-siyah/10 bg-siyah/5">
                <div className="relative aspect-[4/3] bg-siyah/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image_url} alt={p.caption ?? ""} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <span className="text-sm text-siyah/80 line-clamp-1">{p.caption || "—"}</span>
                  <div className="flex gap-2">
                    <GaleriFotoSilButton photoId={p.id} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
