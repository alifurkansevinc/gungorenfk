"use client";

import Image from "next/image";
import { useState, useRef } from "react";

export type PersonGalleryItem = {
  id: string;
  name: string;
  roleLabel: string;
  photo_url: string | null;
};

export function PersonGallery({
  items,
  placeholderImage,
}: {
  items: PersonGalleryItem[];
  placeholderImage: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const step = 120;
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <div className="absolute right-0 top-0 z-10 flex gap-2">
        <button
          type="button"
          onClick={() => scroll("left")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-siyah/20 bg-beyaz text-siyah/70 shadow-sm transition-colors hover:bg-siyah/5 hover:text-siyah"
          aria-label="Önceki"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => scroll("right")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-bordo/30 bg-bordo text-beyaz shadow-sm transition-all hover:shadow-[0_0_20px_rgba(139,21,56,0.4)] hover:border-bordo"
          aria-label="Sonraki"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory pb-2 pt-12"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="flex gap-3 px-1">
          {items.map((person, i) => {
            const isActive = i === activeIndex;
            const src = person.photo_url || placeholderImage;
            return (
              <button
                key={person.id}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`
                  flex w-[100px] flex-shrink-0 snap-center flex-col overflow-hidden rounded-xl border-2 bg-beyaz text-left
                  transition-all duration-300
                  ${isActive ? "border-bordo shadow-[0_0_24px_rgba(139,21,56,0.2)]" : "border-siyah/10 hover:border-siyah/20"}
                `}
              >
                <div className="relative aspect-[2/3] w-full overflow-hidden">
                  <Image
                    src={src}
                    alt={person.name}
                    fill
                    className={`object-cover transition-all duration-300 ${
                      isActive ? "grayscale-0 scale-[1.02]" : "grayscale"
                    }`}
                    unoptimized
                  />
                </div>
                {isActive && (
                  <div className="p-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-bordo">{person.roleLabel}</p>
                    <p className="mt-0.5 font-display text-sm font-semibold text-siyah">{person.name}</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
