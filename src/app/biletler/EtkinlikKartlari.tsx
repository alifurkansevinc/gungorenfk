"use client";

import Link from "next/link";
import { Calendar, MapPin, Clock } from "lucide-react";
import { EtkinlikBiletAlButton } from "./EtkinlikBiletAlButton";
import { BiletIcinGirisCTA } from "./BiletIcinGirisCTA";

type EventItem = {
  id: string;
  title: string;
  slug: string;
  event_date: string | null;
  event_end_date: string | null;
  event_time: string | null;
  event_place: string | null;
  event_type: string | null;
};

export function EtkinlikKartlari({ events, isGuest }: { events: EventItem[]; isGuest?: boolean }) {
  if (!events || events.length === 0) return null;

  return (
    <div className="space-y-4">
      {events.map((e) => {
        const tarihStr = e.event_date
          ? new Date(e.event_date + "T12:00:00").toLocaleDateString("tr-TR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "—";
        return (
          <div
            key={e.id}
            className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border-2 border-siyah/10 bg-beyaz p-5 shadow-lg transition-shadow hover:shadow-xl"
          >
            <div className="min-w-0 flex-1">
              <Link
                href={`/haberler/${e.slug}`}
                className="font-display text-lg font-bold text-siyah hover:text-bordo hover:underline"
              >
                {e.title}
              </Link>
              {e.event_type && (
                <span className="mt-1 inline-block rounded-full bg-siyah/10 px-2.5 py-0.5 text-xs font-semibold text-siyah/70">
                  {e.event_type}
                </span>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-siyah/70">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 shrink-0 text-bordo/80" />
                  {tarihStr}
                </span>
                {e.event_time && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 shrink-0 text-bordo/80" />
                    {e.event_time}
                  </span>
                )}
                {e.event_place && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0 text-bordo/80" />
                    {e.event_place}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0">
              {isGuest ? (
                <BiletIcinGirisCTA variant="inline" />
              ) : (
                <EtkinlikBiletAlButton eventId={e.id} eventTitle={e.title} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
