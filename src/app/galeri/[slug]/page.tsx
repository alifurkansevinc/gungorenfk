import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { GalleryGrid } from "@/components/GalleryGrid";

export default async function GaleriDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: gallery } = await supabase.from("galleries").select("*").eq("slug", slug).single();
  if (!gallery) notFound();
  const { data: photos } = await supabase
    .from("gallery_photos")
    .select("id, image_url, caption, sort_order")
    .eq("gallery_id", gallery.id)
    .order("sort_order");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <nav className="mb-6">
        <Link href="/galeri" className="text-sm text-siyah/70 hover:text-bordo transition-colors">← Galeri listesi</Link>
      </nav>
      <header className="mb-10">
        <h1 className="font-display text-3xl font-bold tracking-tight text-siyah sm:text-4xl">{gallery.title}</h1>
        {gallery.event_date && (
          <p className="mt-2 text-siyah/70">{new Date(gallery.event_date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</p>
        )}
      </header>
      <GalleryGrid photos={photos ?? []} />
    </div>
  );
}
