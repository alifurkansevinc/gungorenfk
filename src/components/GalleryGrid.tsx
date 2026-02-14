"use client";

import { useState } from "react";
import { GalleryLightbox } from "./GalleryLightbox";

type Photo = { id: string; image_url: string; caption: string | null; sort_order: number };

export function GalleryGrid({ photos }: { photos: Photo[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!photos || photos.length === 0) {
    return (
      <p className="col-span-full rounded-2xl border border-siyah/10 bg-siyah/5 py-12 text-center text-siyah/60">
        Henüz fotoğraf yok.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {photos.map((p, index) => (
          <button
            type="button"
            key={p.id}
            onClick={() => setLightboxIndex(index)}
            className="group relative aspect-square overflow-hidden rounded-xl border border-siyah/10 bg-siyah/5 focus:outline-none focus:ring-2 focus:ring-bordo focus:ring-offset-2"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.image_url}
              alt={p.caption ?? ""}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            {p.caption && (
              <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-siyah/80 to-transparent p-2 text-left text-xs text-beyaz line-clamp-2">
                {p.caption}
              </span>
            )}
          </button>
        ))}
      </div>
      {lightboxIndex !== null && (
        <GalleryLightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
