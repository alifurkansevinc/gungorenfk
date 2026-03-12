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

  const selected = items.find((i) => i.id === selectedId) ?? items[0];

  useEffect(() => {
    if (selectedId && storyRef.current) {
      storyRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedId]);

  if (items.length === 0) return null;

  return (
    <div className="w-full">
      {/* Diyagram: yatay akış — yıl + kupa, çizgi ile bağlı */}
      <div className="relative overflow-x-auto overflow-y-hidden pb-2">
        {/* Akış çizgisi (yatay, milestone'ların altında) */}
        <div
          className="absolute left-0 top-[7.5rem] sm:top-[8.5rem] h-0.5 w-full min-w-full bg-gradient-to-r from-bordo/50 via-bordo/30 to-bordo/50"
          aria-hidden
        />
        <ul className="relative flex flex-nowrap gap-6 sm:gap-8 px-2 sm:px-4 min-w-max justify-start sm:justify-center">
          {items.map((item) => {
            const isSelected = selectedId === item.id;
            const src = item.image_url || placeholderImage;

            return (
              <li key={item.id} className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`
                    relative z-10 flex flex-col items-center gap-2 bg-transparent px-2 py-2 transition-all duration-300 ease-out
                    w-[120px] sm:w-[160px]
                    ${isSelected ? "scale-110" : "hover:scale-105"}
                  `}
                >
                  {item.year && (
                    <span className="font-display text-base font-bold tracking-tight text-bordo sm:text-lg">
                      {item.year}
                    </span>
                  )}
                  {/* Kupa görseli — çerçevesiz, büyük ve net */}
                  <div className="relative h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0">
                    <Image
                      src={src}
                      alt={item.name}
                      fill
                      className="object-contain object-center"
                      sizes="(max-width: 640px) 96px, 128px"
                      unoptimized
                      quality={100}
                    />
                  </div>
                  <span className="text-center text-[10px] font-semibold text-beyaz/90 line-clamp-2 sm:text-xs">
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
