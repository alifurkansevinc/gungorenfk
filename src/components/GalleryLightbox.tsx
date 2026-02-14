"use client";

import { useEffect, useCallback } from "react";

type Photo = { id: string; image_url: string; caption: string | null };

export function GalleryLightbox({
  photos,
  currentIndex,
  onClose,
  onNavigate,
}: {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const photo = photos[currentIndex];
  const prev = () => onNavigate(currentIndex <= 0 ? photos.length - 1 : currentIndex - 1);
  const next = () => onNavigate(currentIndex >= photos.length - 1 ? 0 : currentIndex + 1);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onNavigate(currentIndex <= 0 ? photos.length - 1 : currentIndex - 1);
      if (e.key === "ArrowRight") onNavigate(currentIndex >= photos.length - 1 ? 0 : currentIndex + 1);
    },
    [currentIndex, photos.length, onClose, onNavigate]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-siyah/95 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Fotoğraf görüntüleyici"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-beyaz/10 p-2 text-beyaz hover:bg-beyaz/20 transition-colors min-touch"
        aria-label="Kapat"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-beyaz/10 p-3 text-beyaz hover:bg-beyaz/20 transition-colors min-touch sm:left-4"
            aria-label="Önceki"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-beyaz/10 p-3 text-beyaz hover:bg-beyaz/20 transition-colors min-touch sm:right-4"
            aria-label="Sonraki"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </>
      )}

      <div className="relative max-h-[85vh] max-w-4xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.image_url}
          alt={photo.caption ?? ""}
          className="max-h-[85vh] w-auto rounded-lg object-contain"
        />
        {photo.caption && (
          <p className="mt-3 text-center text-sm text-beyaz/90">{photo.caption}</p>
        )}
      </div>

      {photos.length > 1 && (
        <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-beyaz/70">
          {currentIndex + 1} / {photos.length}
        </p>
      )}
    </div>
  );
}
