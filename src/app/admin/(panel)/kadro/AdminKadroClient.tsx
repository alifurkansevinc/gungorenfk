"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { KadroSilButton } from "./KadroSilButton";
import {
  formatSeasonTabLabel,
  getFootballSeasonLabelForDate,
  groupByFootballSeason,
  pickDefaultSeasonKey,
  toCanonicalSeasonKey,
} from "@/lib/football-season";

export type AdminSquadRow = {
  id: string;
  name: string;
  shirt_number: number | null;
  position: string | null;
  position_category: string | null;
  sort_order: number;
  is_active: boolean;
  is_captain: boolean;
  season: string | null;
  optaport_player_id?: string | null;
};

export function AdminKadroClient({ squad }: { squad: AdminSquadRow[] }) {
  const currentKey = getFootballSeasonLabelForDate(new Date());

  const groups = useMemo(() => groupByFootballSeason(squad), [squad]);

  const [activeKey, setActiveKey] = useState(() => pickDefaultSeasonKey(groups));

  const resolvedKey = groups.some((g) => g.key === activeKey)
    ? activeKey
    : pickDefaultSeasonKey(groups);

  const activeGroup = groups.find((g) => g.key === resolvedKey) ?? groups[0] ?? null;
  const members = activeGroup?.members ?? [];
  const activeCount = members.filter((m) => m.is_active).length;
  const passiveCount = members.length - activeCount;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-siyah">Kadro</h1>
          <p className="mt-1 text-siyah/70">
            Sezon sezon yönetim. Güncel:{" "}
            <span className="font-semibold text-siyah">{formatSeasonTabLabel(currentKey)}</span>
            {" · "}Optaport sync aynı etiketleri kullanır.
          </p>
        </div>
        <Link
          href={`/admin/kadro/yeni?season=${encodeURIComponent(resolvedKey || currentKey)}`}
          className="rounded-lg bg-bordo px-4 py-2 text-sm font-semibold text-beyaz hover:bg-bordo-dark"
        >
          + Yeni oyuncu
        </Link>
      </div>

      {groups.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-siyah/20 px-6 py-12 text-center text-siyah/60">
          Henüz oyuncu yok. &quot;Yeni oyuncu&quot; ile ekleyin veya Optaport&apos;tan kadro gönderin.
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Admin kadro sezonları">
            {groups.map((g) => {
              const selected = g.key === (activeGroup?.key ?? "");
              const isCurrent = g.key === currentKey;
              return (
                <button
                  key={g.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveKey(g.key)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    selected
                      ? "border-bordo/50 bg-bordo/10 text-bordo"
                      : "border-siyah/10 bg-white text-siyah/60 hover:border-siyah/20 hover:text-siyah"
                  }`}
                >
                  {g.label}
                  {isCurrent && (
                    <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-bordo/80">
                      güncel
                    </span>
                  )}
                  <span className={`ml-1.5 tabular-nums ${selected ? "text-bordo/70" : "text-siyah/35"}`}>
                    ({g.members.length})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-siyah/55">
            <span>
              Sezon: <strong className="text-siyah">{activeGroup?.label}</strong>
            </span>
            <span>·</span>
            <span>
              Aktif <strong className="text-green-700">{activeCount}</strong>
            </span>
            <span>
              Pasif <strong className="text-siyah/50">{passiveCount}</strong>
            </span>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-siyah/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-siyah/5">
                <tr>
                  <th className="px-4 py-3 font-semibold text-siyah/70">#</th>
                  <th className="px-4 py-3 font-semibold text-siyah/70">Ad Soyad</th>
                  <th className="px-4 py-3 font-semibold text-siyah/70">Pozisyon</th>
                  <th className="px-4 py-3 font-semibold text-siyah/70">Sıra</th>
                  <th className="px-4 py-3 font-semibold text-siyah/70">Durum</th>
                  <th className="px-4 py-3 font-semibold text-siyah/70">Kaynak</th>
                  <th className="px-4 py-3 font-semibold text-siyah/70">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-siyah/60">
                      Bu sezonda oyuncu yok.
                    </td>
                  </tr>
                ) : (
                  members.map((p) => (
                    <tr
                      key={p.id}
                      className={`border-t border-siyah/5 hover:bg-siyah/[0.02] ${
                        !p.is_active ? "opacity-55" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-bold text-bordo">{p.shirt_number ?? "—"}</td>
                      <td className="px-4 py-3 font-medium text-siyah">
                        {p.name}
                        {p.is_captain && (
                          <span className="ml-1.5 rounded bg-siyah/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-siyah/60">
                            Kaptan
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-siyah/80">
                        {p.position ?? p.position_category ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-siyah/80 tabular-nums">{p.sort_order}</td>
                      <td className="px-4 py-3">
                        {p.is_active ? (
                          <span className="text-green-600">Aktif</span>
                        ) : (
                          <span className="text-siyah/45">Pasif</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-siyah/45">
                        {p.optaport_player_id ? "Optaport" : "Manuel"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <Link
                            href={`/admin/kadro/duzenle/${p.id}`}
                            className="font-medium text-bordo hover:underline"
                          >
                            Düzenle
                          </Link>
                          <KadroSilButton id={p.id} name={p.name} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/** Yeni oyuncu formu için varsayılan sezon (query veya güncel). */
export function defaultSeasonFromSearch(searchSeason: string | undefined): string {
  if (searchSeason?.trim()) return toCanonicalSeasonKey(searchSeason);
  return getFootballSeasonLabelForDate(new Date());
}
