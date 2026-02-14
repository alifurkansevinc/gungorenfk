import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default async function HaberDetayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: item } = await supabase.from("news").select("*").eq("slug", slug).single();
  if (!item) notFound();

  const hasEventInfo =
    (item as { event_date?: string | null }).event_date ||
    (item as { event_place?: string | null }).event_place ||
    (item as { event_type?: string | null }).event_type ||
    (item as { event_time?: string | null }).event_time;

  return (
    <article className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-siyah sm:text-3xl">{item.title}</h1>
      {item.published_at && <p className="mt-2 text-siyah/60">{new Date(item.published_at).toLocaleDateString("tr-TR")}</p>}
      {hasEventInfo && (
        <div className="mt-4 rounded-xl border border-siyah/10 bg-siyah/[0.03] p-4">
          <p className="text-sm font-semibold text-siyah/70">Etkinlik bilgisi</p>
          <ul className="mt-2 space-y-1 text-sm text-siyah/80">
            {(item as { event_date?: string | null }).event_date && (
              <li>Tarih: {new Date((item as { event_date: string }).event_date).toLocaleDateString("tr-TR")}</li>
            )}
            {(item as { event_time?: string | null }).event_time && (
              <li>Saat: {(item as { event_time: string }).event_time}</li>
            )}
            {(item as { event_place?: string | null }).event_place && (
              <li>Yer: {(item as { event_place: string }).event_place}</li>
            )}
            {(item as { event_type?: string | null }).event_type && (
              <li>Tip: {(item as { event_type: string }).event_type}</li>
            )}
            {(item as { capacity?: number | null }).capacity && (
              <li>Kapasite: {(item as { capacity: number }).capacity} kişi</li>
            )}
            {(item as { is_online?: boolean | null }).is_online && <li>Çevrimiçi etkinlik</li>}
          </ul>
          {(item as { registration_url?: string | null }).registration_url && (
            <Link
              href={(item as { registration_url: string }).registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-lg bg-bordo px-4 py-2 text-sm font-semibold text-beyaz hover:bg-bordo/90"
            >
              Kayıt / Bilet
            </Link>
          )}
        </div>
      )}
      {item.image_url && (
        <div className="relative mt-4 aspect-video overflow-hidden rounded-lg">
          <Image src={item.image_url} alt="" fill className="object-cover" unoptimized />
        </div>
      )}
      {item.excerpt && <p className="mt-4 text-lg text-siyah/80">{item.excerpt}</p>}
      {item.body && <div className="mt-6 prose text-siyah" dangerouslySetInnerHTML={{ __html: item.body }} />}
      {(item as { external_link?: string | null }).external_link && (
        <p className="mt-6">
          <Link
            href={(item as { external_link: string }).external_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-bordo font-medium hover:underline"
          >
            Harici link →
          </Link>
        </p>
      )}
    </article>
  );
}
