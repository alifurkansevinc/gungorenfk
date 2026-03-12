"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";

export type MilestoneItem = {
  id: string;
  name: string;
  year: string | null;
  image_url: string | null;
  description: string | null;
};

export function MilestoneTimeline({
  items,
  placeholderImage,
}: {
  items: MilestoneItem[];
  placeholderImage: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null);
  const storyRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = items.find((i) => i.id === selectedId) ?? items[0];

  // Seçilen kupa ortaya gelsin
  useEffect(() => {
    if (!selectedId || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-milestone-id="${selectedId}"]`);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [selectedId]);

  // Hikaye alanına yumuşak kaydır
  useEffect(() => {
    if (selectedId && storyRef.current) {
      storyRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedId]);

  if (items.length === 0) return null;

  return (
    <div className="w-full">
      {/* Yatay kaydırmalı liste: seçilen ortada ve büyük — mobil uyumlu */}
      <div className="relative overflow-x-auto overflow-y-hidden pb-2 scroll-smooth -mx-2 px-2 sm:mx-0 sm:px-0">
        {/* Timeline çizgisi — bordo / beyaz tasarım, seçilen büyük kupanın altında */}
        <div className="absolute left-0 top-[9.5rem] sm:top-[13rem] h-0.5 w-full min-w-full bg-gradient-to-r from-transparent via-beyaz/50 to-transparent" aria-hidden />
        <div className="absolute left-0 top-[9.5rem] sm:top-[13rem] h-1 w-full min-w-full rounded-full bg-gradient-to-r from-bordo/90 via-bordo to-bordo/90 shadow-[0_0_10px_rgba(139,21,56,0.4)]" aria-hidden />
        <ul
          ref={listRef}
          className="relative flex flex-nowrap gap-4 sm:gap-6 min-w-max px-[max(0.5rem,50vw-100px)] sm:px-[max(1rem,50vw-140px)]"
        >
          {items.map((item) => {
            const isSelected = selectedId === item.id;
            const src = item.image_url || placeholderImage;

            return (
              <li key={item.id} className="relative flex-shrink-0">
                <button
                  type="button"
                  data-milestone-id={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`
                    relative z-10 flex flex-col items-center gap-1.5 sm:gap-2 bg-transparent px-1.5 py-2 transition-all duration-300 ease-out touch-manipulation
                    w-[88px] min-w-[88px] sm:w-[110px] sm:min-w-[110px]
                    ${isSelected ? "!w-[160px] !min-w-[160px] sm:!w-[220px] sm:!min-w-[220px]" : ""}
                  `}
                >
                  {item.year && (
                    <span className={`font-display font-bold tracking-tight text-bordo transition-all duration-300 ${isSelected ? "text-base sm:text-lg" : "text-sm sm:text-base"}`}>
                      {item.year}
                    </span>
                  )}
                  <div
                    className={`
                    relative flex-shrink-0 transition-all duration-300 ease-out
                    ${isSelected ? "h-36 w-36 sm:h-52 sm:w-52" : "h-20 w-20 sm:h-28 sm:w-28"}
                  `}
                  >
                    <Image
                      src={src}
                      alt={item.name}
                      fill
                      className="object-contain object-center"
                      sizes="(max-width: 640px) 144px, 208px"
                      unoptimized
                      quality={100}
                    />
                  </div>
                  <span className={`text-center font-semibold text-beyaz/95 transition-all duration-300 w-full min-w-0 hyphens-auto break-words ${isSelected ? "text-[11px] leading-tight sm:text-sm" : "text-[10px] leading-tight sm:text-xs"}`}>
                    {item.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Kupa açıklaması — sade, küçük tipografi, konteyner yok */}
      <div ref={storyRef} key={selectedId ?? "none"} className="mt-6 sm:mt-8">
        {selected ? (
          <>
            {selected.year && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-bordo/90 sm:text-xs">
                {selected.year}
              </p>
            )}
            <h3 className="mt-0.5 font-display text-sm font-bold text-beyaz sm:text-base">
              {selected.name}
            </h3>
            {selected.description ? (
              <p className="mt-2 text-xs leading-relaxed text-beyaz/80 whitespace-pre-line sm:text-sm">
                {selected.description}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-beyaz/50">Bu kupa için henüz hikaye eklenmemiş.</p>
            )}
          </>
        ) : (
          <p className="text-center text-xs text-beyaz/50">Yukarıdan bir kupa seçin, hikayesini okuyun.</p>
        )}
      </div>
    </div>
  );
}
