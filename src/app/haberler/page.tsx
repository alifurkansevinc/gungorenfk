import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { FadeInSection } from "@/components/FadeInSection";
import { DEMO_IMAGES } from "@/lib/demo-images";
import { Calendar, MapPin, Clock, Ticket, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Etkinlikler | Güngören FK",
  description: "Güngören FK etkinlikler ve duyurular.",
};

export default async function HaberlerPage() {
  const supabase = await createClient();
  const { data: news } = await supabase
    .from("news")
    .select("id, title, slug, excerpt, image_url, published_at, event_date, event_time, event_place, event_type, is_ticketed")
    .or("published_at.not.is.null,event_date.not.is.null")
    .or("is_hidden.eq.false,is_hidden.is.null")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Hero */}
      <section className="relative flex min-h-[18vh] flex-col justify-end overflow-hidden bg-siyah">
        <Image
          src={DEMO_IMAGES.news}
          alt=""
          fill
          className="object-cover opacity-35"
          sizes="100vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-siyah via-siyah/80 to-siyah/40" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-6 pt-12 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-beyaz sm:text-4xl md:text-5xl">
            Etkinlikler
          </h1>
          <p className="mt-2 max-w-xl text-sm text-beyaz/80 sm:text-base">
            Kulüp etkinlikleri, söyleşiler ve taraftar buluşmaları.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {(!news || news.length === 0) ? (
          <div className="rounded-2xl border-2 border-dashed border-siyah/15 bg-beyaz/60 px-8 py-16 text-center">
            <p className="text-siyah/60">Henüz etkinlik yok.</p>
            <p className="mt-1 text-sm text-siyah/50">Yakında yeni etkinlikler eklenecektir.</p>
          </div>
        ) : (
          <ul className="space-y-8">
            {news.map((n, index) => {
              const isTicketed = (n as { is_ticketed?: boolean }).is_ticketed;
              const eventDate = n.event_date
                ? new Date(n.event_date + "T12:00:00").toLocaleDateString("tr-TR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : null;
              const imageSrc = n.image_url || DEMO_IMAGES.news;
              return (
                <FadeInSection key={n.id}>
                  <li className="overflow-hidden rounded-2xl border border-siyah/10 bg-beyaz shadow-lg transition-all hover:shadow-xl hover:border-bordo/20">
                    <div className="flex flex-col lg:flex-row">
                      {/* Görsel */}
                      <Link
                        href={`/haberler/${n.slug}`}
                        className="relative block aspect-[16/10] w-full shrink-0 overflow-hidden bg-siyah/10 lg:aspect-auto lg:h-auto lg:min-h-[280px] lg:w-[42%]"
                      >
                        <Image
                          src={imageSrc}
                          alt=""
                          fill
                          className="object-cover transition-transform duration-500 hover:scale-105"
                          sizes="(max-width: 1024px) 100vw, 42vw"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-siyah/70 via-transparent to-transparent lg:from-transparent lg:via-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 lg:hidden">
                          <span className="rounded-full bg-bordo px-3 py-1 text-xs font-semibold text-beyaz">
                            {n.event_type || "Etkinlik"}
                          </span>
                          {isTicketed && (
                            <span className="ml-2 rounded-full bg-beyaz/20 px-3 py-1 text-xs font-semibold text-beyaz backdrop-blur-sm">
                              Biletli
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* İçerik */}
                      <div className="flex flex-1 flex-col p-6 lg:p-8">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-bordo/12 px-3 py-1 text-xs font-semibold text-bordo">
                            {n.event_type || "Etkinlik"}
                          </span>
                          {isTicketed && (
                            <span className="flex items-center gap-1 rounded-full bg-siyah/8 px-3 py-1 text-xs font-semibold text-siyah/80">
                              <Ticket className="h-3.5 w-3.5" />
                              Biletli
                            </span>
                          )}
                        </div>
                        <Link href={`/haberler/${n.slug}`} className="mt-3 block group">
                          <h2 className="font-display text-xl font-bold text-siyah transition-colors group-hover:text-bordo sm:text-2xl">
                            {n.title}
                          </h2>
                        </Link>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-siyah/65">
                          {eventDate && (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 shrink-0 text-bordo/70" />
                              {eventDate}
                            </span>
                          )}
                          {n.event_time && (
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4 shrink-0 text-bordo/70" />
                              {n.event_time}
                            </span>
                          )}
                          {n.event_place && (
                            <span className="flex items-center gap-1.5">
                              <MapPin className="h-4 w-4 shrink-0 text-bordo/70" />
                              {n.event_place}
                            </span>
                          )}
                        </div>
                        {n.excerpt && (
                          <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-siyah/75">
                            {n.excerpt}
                          </p>
                        )}
                        <div className="mt-6 flex flex-wrap items-center gap-3">
                          <Link
                            href={`/haberler/${n.slug}`}
                            className="inline-flex items-center gap-2 rounded-xl bg-bordo px-5 py-2.5 text-sm font-semibold text-beyaz shadow-md transition-all hover:bg-bordo/90 hover:shadow-lg"
                          >
                            Detay
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                          {isTicketed && (
                            <Link
                              href="/biletler"
                              className="inline-flex items-center gap-2 rounded-xl border-2 border-bordo px-5 py-2.5 text-sm font-semibold text-bordo transition-all hover:bg-bordo/10"
                            >
                              <Ticket className="h-4 w-4" />
                              Bilet Al
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                </FadeInSection>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
