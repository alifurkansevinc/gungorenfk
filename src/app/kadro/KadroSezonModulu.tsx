"use client";

import { useMemo, useState } from "react";
import type { SquadMember } from "@/types/db";
import type { SquadMemberWithStats } from "@/lib/data";
import type { PersonGalleryItem } from "@/components/PersonGallery";
import { PersonGallery } from "@/components/PersonGallery";
import {
  getFootballSeasonLabelForDate,
  groupByFootballSeason,
  pickDefaultSeasonKey,
} from "@/lib/football-season";

function toGalleryItems(squad: (SquadMember | SquadMemberWithStats)[]): PersonGalleryItem[] {
  const sorted = [...squad].sort((a, b) => a.sort_order - b.sort_order);
  return sorted.map((p) => {
    const parts: string[] = [];
    if (p.is_captain) parts.push("Kaptan");
    if (p.position) parts.push(p.position);
    if (p.shirt_number != null) parts.push(`#${p.shirt_number}`);
    const roleLabel = parts.length > 0 ? parts.join(" · ") : "Oyuncu";
    const withStats = p as SquadMemberWithStats;
    const statsLine =
      typeof withStats.goals === "number" ||
      typeof withStats.assists === "number" ||
      typeof withStats.appearances === "number"
        ? [
            withStats.goals > 0 ? `${withStats.goals} gol` : "",
            withStats.assists > 0 ? `${withStats.assists} asist` : "",
            withStats.appearances > 0 ? `${withStats.appearances} maç` : "",
          ]
            .filter(Boolean)
            .join(" · ") || null
        : null;
    return {
      id: p.id,
      name: p.name,
      roleLabel,
      photo_url: p.photo_url,
      statsLine: statsLine ?? undefined,
    };
  });
}

export function KadroSezonModulu({
  squad,
  placeholderImage,
}: {
  squad: (SquadMember | SquadMemberWithStats)[];
  placeholderImage: string;
}) {
  const currentKey = getFootballSeasonLabelForDate(new Date());

  const groups = useMemo(() => {
    const raw = groupByFootballSeason(squad);
    return raw
      .map((g) => {
        // Güncel sezon: yalnızca aktif; geçmiş: o sezonun tüm kayıtları
        const members =
          g.key === currentKey ? g.members.filter((m) => m.is_active !== false) : g.members;
        return { ...g, members };
      })
      .filter((g) => g.members.length > 0);
  }, [squad, currentKey]);

  const [activeKey, setActiveKey] = useState(() => pickDefaultSeasonKey(groups));

  const resolvedKey = groups.some((g) => g.key === activeKey)
    ? activeKey
    : pickDefaultSeasonKey(groups);

  const activeGroup = groups.find((g) => g.key === resolvedKey) ?? groups[0] ?? null;

  if (squad.length === 0 || !activeGroup) return null;

  const items = toGalleryItems(activeGroup.members);
  const isCurrent = activeGroup.key === currentKey;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-beyaz/45">Sezon</p>
          <p className="mt-1 font-display text-lg font-bold text-beyaz sm:text-xl">
            {activeGroup.label}
            {isCurrent && (
              <span className="ml-2 rounded-md border border-bordo/40 bg-bordo/20 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-beyaz/90">
                Güncel
              </span>
            )}
            <span className="ml-2 text-sm font-medium text-beyaz/45">
              {activeGroup.members.length} oyuncu
            </span>
          </p>
        </div>
      </div>

      {groups.length > 1 && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Kadro sezonları">
          {groups.map((g) => {
            const selected = g.key === activeGroup.key;
            const current = g.key === currentKey;
            return (
              <button
                key={g.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveKey(g.key)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                  selected
                    ? "border-bordo/60 bg-bordo/25 text-beyaz"
                    : "border-beyaz/10 bg-beyaz/[0.03] text-beyaz/55 hover:border-beyaz/20 hover:text-beyaz/85"
                }`}
              >
                {g.label}
                {current && !selected && (
                  <span className="ml-1 text-[10px] uppercase tracking-wide text-bordo/80">şimdi</span>
                )}
                <span
                  className={`ml-1.5 tabular-nums ${selected ? "text-beyaz/70" : "text-beyaz/35"}`}
                >
                  ({g.members.length})
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div role="tabpanel" key={activeGroup.key} className="animate-fade-in-up">
        {items.length > 0 ? (
          <PersonGallery items={items} placeholderImage={placeholderImage} />
        ) : (
          <p className="py-12 text-center text-beyaz/55">Bu sezonda oyuncu yok.</p>
        )}
      </div>
    </div>
  );
}
