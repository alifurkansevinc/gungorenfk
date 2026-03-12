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
      {/* Yatay kaydırmalı liste: seçilen ortada ve büyük */}
      <div className="relative overflow-x-auto overflow-y-hidden pb-2 scroll-smooth">
        {/* Akış çizgisi */}
        <div
          className="absolute left-0 top-[7.5rem] sm:top-[8.5rem] h-0.5 w-full min-w-full bg-gradient-to-r from-bordo/50 via-bordo/30 to-bordo/50"
          aria-hidden
        />
        <ul
          ref={listRef}
          className="relative flex flex-nowrap gap-6 sm:gap-8 min-w-max px-[max(1rem,50vw-80px)] sm:px-[max(1.5rem,50vw-100px)]"
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
                    relative z-10 flex flex-col items-center gap-2 bg-transparent px-2 py-2 transition-all duration-300 ease-out
                    w-[100px] sm:w-[120px]
                    ${isSelected ? "!w-[140px] sm:!w-[180px]" : ""}
                  `}
                >
                  {item.year && (
                    <span className={`font-display font-bold tracking-tight text-bordo transition-all duration-300 ${isSelected ? "text-lg sm:text-xl" : "text-base sm:text-lg"}`}>
                      {item.year}
                    </span>
                  )}
                  <div
                    className={`
                    relative flex-shrink-0 transition-all duration-300 ease-out
                    ${isSelected ? "h-32 w-32 sm:h-40 sm:w-40" : "h-24 w-24 sm:h-32 sm:w-32"}
                  `}
                  >
                    <Image
                      src={src}
                      alt={item.name}
                      fill
                      className="object-contain object-center"
                      sizes="(max-width: 640px) 128px, 160px"
                      unoptimized
                      quality={100}
                    />
                  </div>
                  <span className={`text-center font-semibold text-beyaz/90 line-clamp-2 transition-all duration-300 ${isSelected ? "text-xs sm:text-sm" : "text-[10px] sm:text-xs"}`}>
                    {item.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Dinamik hikaye alanı — dokununca / tıklanınca seçilen kupanın hikayesi */}
      <div
        ref={storyRef}
        key={selectedId ?? "none"}
        className="mt-8 rounded-2xl border border-beyaz/15 bg-gradient-to-b from-beyaz/10 to-beyaz/[0.02] p-6 transition-all duration-300 sm:p-8"
      >
        {selected ? (
          <>
            {selected.year && (
              <p className="text-xs font-semibold uppercase tracking-wider text-bordo sm:text-sm">
                {selected.year}
              </p>
            )}
            <h3 className="mt-1 font-display text-xl font-bold text-beyaz sm:text-2xl">
              {selected.name}
            </h3>
            {selected.description ? (
              <div className="mt-4 border-t border-beyaz/10 pt-4">
                <p className="text-sm leading-relaxed text-beyaz/90 whitespace-pre-line sm:text-base">
                  {selected.description}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-beyaz/60">Bu kupa için henüz hikaye eklenmemiş.</p>
            )}
          </>
        ) : (
          <p className="text-center text-beyaz/60">Yukarıdan bir kupa seçin, hikayesini okuyun.</p>
        )}
      </div>
    </div>
  );
}
