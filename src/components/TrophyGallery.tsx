"use client";

import Image from "next/image";
import { useState, useRef } from "react";

export type TrophyGalleryItem = {
  id: string;
  name: string;
  year?: string | null;
  image_url: string | null;
  description?: string | null;
};

export function TrophyGallery({
  items,
  placeholderImage,
}: {
  items: TrophyGalleryItem[];
  placeholderImage: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const step = 140;
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  const active = items[activeIndex]!;
  const activeSrc = active.image_url || placeholderImage;

  return (
    <div className="relative">
      <div className="absolute right-0 top-0 z-10 flex gap-2">
        <button
          type="button"
          onClick={() => scroll("left")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-beyaz/20 bg-siyah text-beyaz/80 shadow-sm transition-colors hover:bg-beyaz/10 hover:text-beyaz"
          aria-label="Önceki"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => scroll("right")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-bordo/50 bg-bordo text-beyaz shadow-sm transition-all hover:shadow-[0_0_20px_rgba(139,21,56,0.4)] hover:border-bordo"
          aria-label="Sonraki"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Diyagram akış çizgisi */}
      <div className="absolute left-0 right-12 top-[5.5rem] h-0.5 bg-gradient-to-r from-bordo/40 via-beyaz/20 to-transparent pointer-events-none hidden sm:block" aria-hidden />

      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory pt-12 pb-1"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="flex h-[280px] gap-2 px-1 sm:h-[320px]">
          {items.map((trophy, i) => {
            const isActive = i === activeIndex;
            const src = trophy.image_url || placeholderImage;
            return (
              <button
                key={trophy.id}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`
                  relative flex h-full flex-shrink-0 snap-center flex-col overflow-hidden rounded-xl border-2 border-siyah/20 bg-siyah/60 text-left transition-all duration-300 ease-out
                  ${isActive ? "w-[160px] border-bordo shadow-[0_0_24px_rgba(139,21,56,0.25)] sm:w-[200px]" : "w-[70px] hover:border-siyah/40 sm:w-[80px]"}
                `}
              >
                <div className={`relative flex-1 w-full ${isActive ? "min-h-[140px]" : "min-h-[80px]"}`}>
                  <Image
                    src={src}
                    alt={trophy.name}
                    fill
                    className={`object-contain transition-all duration-300 ${isActive ? "scale-100" : "scale-90 opacity-80"}`}
                    sizes="(max-width: 640px) 160px, 200px"
                    unoptimized
                  />
                </div>
                <div className={`shrink-0 bg-siyah/40 px-2 py-1.5 text-center ${isActive ? "block" : "overflow-hidden"}`}>
                  <p className={`font-display font-bold text-beyaz truncate ${isActive ? "text-sm" : "text-[10px]"}`}>{trophy.name}</p>
                  {trophy.year && <p className="text-[10px] text-bordo font-semibold">{trophy.year}</p>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Seçili kupanın hikayesi (açıklama) — kadro detay alanı gibi */}
      <div className="mt-3 w-full border-t border-beyaz/10 py-3 sm:mt-4 sm:py-4">
        {active.year && (
          <p className="text-xs font-semibold uppercase tracking-wider text-bordo sm:text-sm">
            {active.year}
          </p>
        )}
        <p className="mt-1 font-display text-lg font-semibold text-beyaz sm:text-xl">
          {active.name}
        </p>
        {active.description && (
          <div className="mt-2 rounded-lg bg-beyaz/5 border border-beyaz/10 px-4 py-3">
            <p className="text-sm text-beyaz/90 leading-relaxed whitespace-pre-line">
              {active.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
