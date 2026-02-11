"use client";

import { useRef } from "react";

export function PersonCardSlider({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.6;
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  return (
    <div className="relative pt-1">
      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory pb-2 pt-12"
        style={{ scrollbarWidth: "thin" }}
      >
        <div className="flex gap-4">{children}</div>
      </div>
      <div className="absolute right-0 top-0 flex gap-2 pt-0.5">
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
    </div>
  );
}
