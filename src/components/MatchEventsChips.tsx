import { ArrowLeftRight, Square, Target } from "lucide-react";
import { buildMatchEventDisplays, type MatchEventDisplay, type MatchEventRow } from "@/lib/match-events";

function EventIcon({ tone }: { tone: string }) {
  if (tone === "goal") {
    return <Target className="h-3 w-3 shrink-0 text-bordo" strokeWidth={2.5} aria-hidden />;
  }
  if (tone === "opponent_goal") {
    return <Target className="h-3 w-3 shrink-0 text-siyah/45" strokeWidth={2.5} aria-hidden />;
  }
  if (tone === "red_card") {
    return <Square className="h-2.5 w-2.5 shrink-0 fill-red-600 stroke-red-600" aria-hidden />;
  }
  if (tone === "yellow_card") {
    return <Square className="h-2.5 w-2.5 shrink-0 fill-amber-400 stroke-amber-500" aria-hidden />;
  }
  if (tone === "substitution" || tone === "sub_in" || tone === "sub_out") {
    return <ArrowLeftRight className="h-3 w-3 shrink-0 text-siyah/45" aria-hidden />;
  }
  return null;
}

function eventText(row: MatchEventDisplay): string {
  if (row.tone === "opponent_goal") return "Gol";
  if (row.tone === "goal") return row.detail.split(" · ")[0] || "Gol";
  if (row.tone === "substitution" && row.substitutionIn && row.substitutionOut) {
    return `${row.substitutionIn} ↔ ${row.substitutionOut}`;
  }
  return row.detail || row.label;
}

function EventLine({ row, align }: { row: MatchEventDisplay; align: "left" | "right" }) {
  const minute = row.minute != null ? `${row.minute}'` : "—";
  const text = eventText(row);
  const title = `${minute} ${row.label}${row.detail ? ` — ${row.detail}` : ""}`;
  const minuteEl = <span className="w-7 shrink-0 tabular-nums text-siyah/40">{minute}</span>;
  const nameEl = <span className="min-w-0 font-medium text-siyah/80">{text}</span>;

  return (
    <li
      title={title}
      className={`flex items-start gap-1.5 text-[11px] leading-snug ${align === "right" ? "justify-end text-right" : "text-left"}`}
    >
      {align === "left" ? (
        <>
          {minuteEl}
          <span className="mt-0.5">
            <EventIcon tone={row.tone} />
          </span>
          {nameEl}
        </>
      ) : (
        <>
          {nameEl}
          <span className="mt-0.5">
            <EventIcon tone={row.tone} />
          </span>
          {minuteEl}
        </>
      )}
    </li>
  );
}

function EventColumn({ rows, align }: { rows: MatchEventDisplay[]; align: "left" | "right" }) {
  if (rows.length === 0) return <div />;
  return (
    <ul className="min-w-0 space-y-1">
      {rows.map((row) => (
        <EventLine key={row.id} row={row} align={align} />
      ))}
    </ul>
  );
}

/** Fikstür satırı — olaylar ilgili takımın altında, dakika sırasıyla. */
export function MatchEventsChips({
  events,
  homeAway,
}: {
  events: MatchEventRow[];
  homeAway: "home" | "away" | string | null;
}) {
  if (!events?.length) return null;
  const rows = buildMatchEventDisplays(events);
  if (rows.length === 0) return null;

  const ours = rows.filter((row) => row.tone !== "opponent_goal");
  const theirs = rows.filter((row) => row.tone === "opponent_goal");
  const weAreHome = homeAway !== "away";
  const left = weAreHome ? ours : theirs;
  const right = weAreHome ? theirs : ours;

  return (
    <div className="mt-3 grid w-full max-w-3xl grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)] items-start gap-x-4">
      <EventColumn rows={left} align="left" />
      <div />
      <EventColumn rows={right} align="right" />
    </div>
  );
}
