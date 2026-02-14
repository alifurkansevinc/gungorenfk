"use client";

import { useState } from "react";
import Image from "next/image";
import type { SquadMember } from "@/types/db";
import type { PersonGalleryItem } from "@/components/PersonGallery";
import { PersonGallery } from "@/components/PersonGallery";
import { ChevronDown, ChevronUp } from "lucide-react";

function toGalleryItems(squad: SquadMember[]): PersonGalleryItem[] {
  const sorted = [...squad].sort((a, b) => a.sort_order - b.sort_order);
  return sorted.map((p) => {
    const parts: string[] = [];
    if (p.is_captain) parts.push("Kaptan");
    if (p.position) parts.push(p.position);
    if (p.shirt_number != null) parts.push(`#${p.shirt_number}`);
    const roleLabel = parts.length > 0 ? parts.join(" · ") : "Oyuncu";
    return {
      id: p.id,
      name: p.name,
      roleLabel,
      photo_url: p.photo_url,
    };
  });
}

export function KadroSezonModulu({
  squad,
  placeholderImage,
}: {
  squad: SquadMember[];
  placeholderImage: string;
}) {
  const groups = (() => {
    const map = new Map<string, SquadMember[]>();
    for (const p of squad) {
      const key = (p.season && p.season.trim()) || "Kadro";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries()).map(([label, members]) => ({
      label,
      members: members.sort((a, b) => a.sort_order - b.sort_order),
    }));
  })();

  const [openIndex, setOpenIndex] = useState(0);

  if (squad.length === 0) return null;

  if (groups.length <= 1 && (groups[0]?.label === "Kadro" || !groups[0]?.label)) {
    return (
      <PersonGallery
        items={toGalleryItems(squad)}
        placeholderImage={placeholderImage}
      />
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((g, idx) => {
        const isOpen = openIndex === idx;
        const items = toGalleryItems(g.members);
        return (
          <div
            key={g.label}
            className="overflow-hidden rounded-2xl border border-beyaz/10 bg-siyah/40"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : idx)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-beyaz/5"
            >
              <h2 className="font-display text-lg font-bold text-beyaz">
                {g.label}
              </h2>
              <span className="text-beyaz/70">
                {isOpen ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-beyaz/10 px-2 pb-4 pt-2">
                <PersonGallery
                  items={items}
                  placeholderImage={placeholderImage}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
