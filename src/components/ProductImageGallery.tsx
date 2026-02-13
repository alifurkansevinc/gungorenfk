"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductImageGallery({ images, productName }: { images: string[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const main = images[activeIndex] || images[0];

  if (!main) return null;

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-siyah/10 bg-beyaz shadow-lg">
        <Image
          src={main}
          alt={productName}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          unoptimized
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                activeIndex === i ? "border-bordo" : "border-siyah/10 hover:border-siyah/30"
              }`}
            >
              <Image src={url} alt="" fill className="object-cover" sizes="64px" unoptimized />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
