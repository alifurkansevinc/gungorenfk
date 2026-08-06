import { ArrowLeftRight, Square, Target } from "lucide-react";
import { buildMatchEventDisplays, type MatchEventRow } from "@/lib/match-events";

function ChipIcon({ tone }: { tone: string }) {
  if (tone === "goal" || tone === "opponent_goal") {
    return <Target className="h-3 w-3" strokeWidth={2.5} aria-hidden />;
  }
  if (tone === "red_card") {
    return <Square className="h-2.5 w-2.5 fill-red-600 stroke-red-600" aria-hidden />;
  }
  if (tone === "yellow_card") {
    return <Square className="h-2.5 w-2.5 fill-amber-400 stroke-amber-500" aria-hidden />;
  }
  if (tone === "substitution" || tone === "sub_in" || tone === "sub_out") {
    return <ArrowLeftRight className="h-3 w-3" aria-hidden />;
  }
  return null;
}

function chipClass(tone: string): string {
  switch (tone) {
    case "goal":
      return "border-bordo/20 bg-bordo/8 text-bordo";
    case "opponent_goal":
      return "border-siyah/12 bg-siyah/[0.04] text-siyah/65";
    case "red_card":
      return "border-red-200 bg-red-50 text-red-700";
    case "yellow_card":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "substitution":
    case "sub_in":
    case "sub_out":
      return "border-siyah/10 bg-white text-siyah/60";
    case "injury":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-siyah/10 bg-white text-siyah/60";
  }
}

/** Fikstür satırı — kompakt olay çipleri */
export function MatchEventsChips({
  events,
  max = 6,
}: {
  events: MatchEventRow[];
  max?: number;
}) {
  if (!events?.length) return null;
  const rows = buildMatchEventDisplays(events);
  if (rows.length === 0) return null;

  const shown = rows.slice(0, max);
  const rest = rows.length - shown.length;

  return (
    <div className="mt-2.5 flex max-w-xl flex-wrap items-center justify-center gap-1.5">
      {shown.map((row) => {
        const shortDetail =
          row.tone === "goal" || row.tone === "opponent_goal" || row.tone === "red_card" || row.tone === "yellow_card"
            ? row.detail.split(" · ")[0]
            : row.tone === "substitution"
              ? row.substitutionIn || row.detail
              : row.detail;
        return (
          <span
            key={row.id}
            title={`${row.minute != null ? `${row.minute}' ` : ""}${row.label}${row.detail ? ` — ${row.detail}` : ""}`}
            className={`inline-flex max-w-[11rem] items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${chipClass(row.tone)}`}
          >
            <span className="tabular-nums opacity-70">{row.minute != null ? `${row.minute}'` : "—"}</span>
            <ChipIcon tone={row.tone} />
            <span className="truncate">{shortDetail || row.label}</span>
          </span>
        );
      })}
      {rest > 0 && (
        <span className="rounded-full border border-siyah/10 bg-siyah/[0.03] px-2 py-0.5 text-[10px] font-semibold text-siyah/45">
          +{rest}
        </span>
      )}
    </div>
  );
}
