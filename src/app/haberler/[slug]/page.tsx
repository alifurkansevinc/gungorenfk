import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Ticket, Calendar, Clock, MapPin, ArrowLeft } from "lucide-react";
import { DEMO_IMAGES } from "@/lib/demo-images";

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
  const imageSrc = item.image_url || DEMO_IMAGES.news;
  const eventDateStr = (item as { event_date?: string | null }).event_date
    ? new Date((item as { event_date: string }).event_date).toLocaleDateString("tr-TR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Kapak görseli */}
      <section className="relative aspect-[21/9] w-full overflow-hidden bg-siyah min-h-[200px]">
        <Image
          src={imageSrc}
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-siyah via-siyah/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-4xl">
            <Link
              href="/haberler"
              className="inline-flex items-center gap-2 text-sm font-medium text-beyaz/90 hover:text-beyaz mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Etkinliklere dön
            </Link>
            <h1 className="font-display text-2xl font-bold text-beyaz drop-shadow-lg sm:text-3xl lg:text-4xl">
              {item.title}
            </h1>
            {item.published_at && (
              <p className="mt-2 text-sm text-beyaz/80">
                {new Date(item.published_at).toLocaleDateString("tr-TR")}
              </p>
            )}
          </div>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        {hasEventInfo && (
          <div className="rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-bordo">Etkinlik bilgisi</p>
            <ul className="mt-4 space-y-3 text-sm text-siyah/85">
              {eventDateStr && (
                <li className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 shrink-0 text-bordo/80" />
                  {eventDateStr}
                </li>
              )}
              {(item as { event_time?: string | null }).event_time && (
                <li className="flex items-center gap-3">
                  <Clock className="h-5 w-5 shrink-0 text-bordo/80" />
                  {(item as { event_time: string }).event_time}
                </li>
              )}
              {(item as { event_place?: string | null }).event_place && (
                <li className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 shrink-0 text-bordo/80" />
                  {(item as { event_place: string }).event_place}
                </li>
              )}
              {(item as { event_type?: string | null }).event_type && (
                <li className="flex items-center gap-3">
                  <span className="rounded-full bg-siyah/8 px-2.5 py-0.5 text-xs font-semibold text-siyah/80">
                    {(item as { event_type: string }).event_type}
                  </span>
                </li>
              )}
              {(item as { capacity?: number | null }).capacity && (
                <li>Kapasite: {(item as { capacity: number }).capacity} kişi</li>
              )}
              {(item as { is_online?: boolean | null }).is_online && (
                <li>Çevrimiçi etkinlik</li>
              )}
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              {(item as { is_ticketed?: boolean | null }).is_ticketed && (
                <Link
                  href="/biletler"
                  className="inline-flex items-center gap-2 rounded-xl bg-bordo px-5 py-2.5 text-sm font-semibold text-beyaz shadow-md transition-all hover:bg-bordo/90"
                >
                  <Ticket className="h-4 w-4" />
                  Bilet Al
                </Link>
              )}
              {(item as { registration_url?: string | null }).registration_url && (
                <Link
                  href={(item as { registration_url: string }).registration_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-bordo px-5 py-2.5 text-sm font-semibold text-bordo transition-all hover:bg-bordo/10"
                >
                  Kayıt / Bilet (harici)
                </Link>
              )}
            </div>
          </div>
        )}

        {item.excerpt && (
          <p className="mt-8 text-lg leading-relaxed text-siyah/80">{item.excerpt}</p>
        )}
        {item.body && (
          <div
            className="mt-6 prose prose-lg max-w-none text-siyah prose-headings:font-display prose-headings:font-bold prose-headings:text-siyah prose-p:text-siyah/90 prose-a:text-bordo prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: item.body }}
          />
        )}
        {(item as { external_link?: string | null }).external_link && (
          <p className="mt-8">
            <Link
              href={(item as { external_link: string }).external_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-siyah/15 bg-beyaz px-4 py-2.5 text-sm font-medium text-siyah hover:bg-siyah/5"
            >
              Harici link →
            </Link>
          </p>
        )}

        <div className="mt-12 pt-8 border-t border-siyah/10">
          <Link
            href="/haberler"
            className="inline-flex items-center gap-2 text-sm font-medium text-bordo hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Tüm etkinliklere dön
          </Link>
        </div>
      </article>
    </div>
  );
}
