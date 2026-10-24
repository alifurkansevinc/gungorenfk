import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  HeartPulse,
  Square,
  Target,
} from "lucide-react";
import type { MatchEventDisplay, MatchEventRow } from "@/lib/match-events";
import { buildMatchEventDisplays } from "@/lib/match-events";

function minuteText(m: number | null | undefined): string {
  if (m == null) return "—";
  return `${m}'`;
}

function ToneIcon({ tone }: { tone: string }) {
  if (tone === "goal" || tone === "opponent_goal") {
    return <Target className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
  }
  if (tone === "assist") {
    return <span className="text-[10px] font-black leading-none">A</span>;
  }
  if (tone === "red_card") {
    return <Square className="h-3 w-3 fill-red-600 stroke-red-600" aria-hidden />;
  }
  if (tone === "yellow_card") {
    return <Square className="h-3 w-3 fill-amber-400 stroke-amber-500" aria-hidden />;
  }
  if (tone === "injury") {
    return <HeartPulse className="h-3.5 w-3.5" aria-hidden />;
  }
  if (tone === "substitution" || tone === "sub_in" || tone === "sub_out") {
    return <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />;
  }
  return <Target className="h-3.5 w-3.5" aria-hidden />;
}

function toneClasses(tone: string): string {
  switch (tone) {
    case "goal":
      return "border-bordo/25 bg-bordo/10 text-bordo";
    case "opponent_goal":
      return "border-siyah/15 bg-siyah/5 text-siyah/70";
    case "red_card":
      return "border-red-200 bg-red-50 text-red-700";
    case "injury":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "assist":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "yellow_card":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "substitution":
    case "sub_in":
    case "sub_out":
      return "border-siyah/10 bg-siyah/[0.03] text-siyah/70";
    default:
      return "border-siyah/10 bg-siyah/[0.03] text-siyah/70";
  }
}

function EventDetail({ row }: { row: MatchEventDisplay }) {
  if (row.substitutionIn && row.substitutionOut) {
    return (
      <div className="flex flex-col gap-0.5 text-sm leading-snug">
        <span className="inline-flex items-center gap-1.5 text-emerald-700">
          <ArrowUpFromLine className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate font-medium">{row.substitutionIn}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 text-siyah/55">
          <ArrowDownToLine className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">{row.substitutionOut}</span>
        </span>
      </div>
    );
  }
  if (!row.detail) return null;
  return <p className="text-sm text-siyah/75">{row.detail}</p>;
}

function EventItem({ row, emphasize }: { row: MatchEventDisplay; emphasize?: boolean }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-siyah/45">
        {minuteText(row.minute)}
      </span>
      <span
        className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${toneClasses(row.tone)}`}
      >
        <ToneIcon tone={row.tone} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className={`text-xs font-bold uppercase tracking-wider ${emphasize ? "text-bordo" : "text-siyah/50"}`}>
          {row.label}
        </p>
        <div className="mt-0.5">
          <EventDetail row={row} />
        </div>
      </div>
    </li>
  );
}

const DETAIL_TONES = new Set(["goal", "assist", "red_card", "opponent_goal"]);

/** Maç detay — gol, asist ve kırmızı kart. */
export function MatchEventsTimeline({ events }: { events: MatchEventRow[] }) {
  if (!events.length) return null;

  const rows = buildMatchEventDisplays(events, { separateAssists: true }).filter((row) =>
    DETAIL_TONES.has(row.tone),
  );
  if (rows.length === 0) return null;

  return (
    <section className="mt-10 overflow-hidden rounded-2xl border border-siyah/10 bg-beyaz shadow-sm">
      <div className="border-b border-siyah/8 bg-gradient-to-r from-bordo/[0.06] via-transparent to-transparent px-5 py-4 sm:px-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-siyah/60">Maç olayları</h2>
        <p className="mt-1 text-xs text-siyah/45">Gol, asist ve kırmızı kart</p>
      </div>

      <ol className="space-y-4 px-5 py-5 sm:px-6">
        {rows.map((row) => (
          <EventItem key={row.id} row={row} emphasize={row.tone === "goal" || row.tone === "assist" || row.tone === "red_card"} />
        ))}
      </ol>
    </section>
  );
}
