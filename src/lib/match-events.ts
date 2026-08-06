/** Maç olayları — Optaport sync + site gösterimi */

export type MatchEventType =
  | "goal"
  | "assist"
  | "yellow_card"
  | "red_card"
  | "sub_in"
  | "sub_out"
  | "injury"
  | "opponent_goal";

export type MatchEventRow = {
  id: string;
  match_id: string;
  minute: number | null;
  event_type: MatchEventType;
  player_name: string | null;
  related_player_name: string | null;
  optaport_player_id?: string | null;
  related_optaport_player_id?: string | null;
  meta?: Record<string, unknown> | null;
  sort_order?: number;
};

export type MatchEventDisplayTone =
  | MatchEventType
  | "substitution"
  | "opponent_goal";

export type MatchEventDisplay = {
  id: string;
  minute: number | null;
  label: string;
  detail: string;
  tone: MatchEventDisplayTone;
  substitutionIn?: string;
  substitutionOut?: string;
  isPrimary: boolean;
};

function isOpponentGoal(e: MatchEventRow): boolean {
  return (
    e.event_type === "opponent_goal" ||
    (e.event_type === "goal" && !e.player_name && e.meta?.opponent === true)
  );
}

/** Ham olayları gösterim satırlarına çevir (gol+asist, değişiklik çiftleri). */
export function buildMatchEventDisplays(events: MatchEventRow[]): MatchEventDisplay[] {
  const sorted = [...events].sort((a, b) => {
    const am = a.minute ?? 999;
    const bm = b.minute ?? 999;
    if (am !== bm) return am - bm;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  const used = new Set<string>();
  const rows: MatchEventDisplay[] = [];

  for (const e of sorted) {
    if (used.has(e.id)) continue;

    if (isOpponentGoal(e)) {
      used.add(e.id);
      rows.push({
        id: e.id,
        minute: e.minute,
        label: "Rakip gol",
        detail: "",
        tone: "opponent_goal",
        isPrimary: true,
      });
      continue;
    }

    if (e.event_type === "goal") {
      const assist = sorted.find(
        (a) =>
          a.event_type === "assist" &&
          !used.has(a.id) &&
          a.minute === e.minute &&
          (a.meta?.goal_player_id === e.optaport_player_id ||
            (!!e.player_name && a.meta?.goal_player_name === e.player_name)),
      );
      const assistName = e.related_player_name || assist?.player_name || null;
      if (assist) used.add(assist.id);
      used.add(e.id);
      const scorer = e.player_name || "—";
      rows.push({
        id: e.id,
        minute: e.minute,
        label: "Gol",
        detail: assistName ? `${scorer} · Asist: ${assistName}` : scorer,
        tone: "goal",
        isPrimary: true,
      });
      continue;
    }

    if (e.event_type === "assist") {
      used.add(e.id);
      rows.push({
        id: e.id,
        minute: e.minute,
        label: "Asist",
        detail: e.player_name || "—",
        tone: "assist",
        isPrimary: true,
      });
      continue;
    }

    if (e.event_type === "sub_out") {
      const partnerId =
        typeof e.meta?.substitution_partner_id === "string"
          ? e.meta.substitution_partner_id
          : e.related_optaport_player_id || null;
      const partner = partnerId
        ? sorted.find(
            (x) =>
              x.event_type === "sub_in" &&
              !used.has(x.id) &&
              x.minute === e.minute &&
              x.optaport_player_id === partnerId,
          )
        : sorted.find(
            (x) => x.event_type === "sub_in" && !used.has(x.id) && x.minute === e.minute,
          );
      const outName = e.player_name || "—";
      const inName = e.related_player_name || partner?.player_name || "—";
      if (partner) used.add(partner.id);
      used.add(e.id);
      rows.push({
        id: e.id,
        minute: e.minute,
        label: "Değişiklik",
        detail: `${inName} ↔ ${outName}`,
        tone: "substitution",
        substitutionIn: inName,
        substitutionOut: outName,
        isPrimary: false,
      });
      continue;
    }

    if (e.event_type === "sub_in") {
      used.add(e.id);
      const inName = e.player_name || "—";
      const outName = e.related_player_name;
      if (outName) {
        rows.push({
          id: e.id,
          minute: e.minute,
          label: "Değişiklik",
          detail: `${inName} ↔ ${outName}`,
          tone: "substitution",
          substitutionIn: inName,
          substitutionOut: outName,
          isPrimary: false,
        });
      } else {
        rows.push({
          id: e.id,
          minute: e.minute,
          label: "Oyuna girdi",
          detail: inName,
          tone: "sub_in",
          isPrimary: false,
        });
      }
      continue;
    }

    used.add(e.id);
    const labels: Partial<Record<MatchEventType, string>> = {
      yellow_card: "Sarı kart",
      red_card: "Kırmızı kart",
      injury: "Sakatlık",
    };
    rows.push({
      id: e.id,
      minute: e.minute,
      label: labels[e.event_type] || e.event_type,
      detail: e.player_name || "—",
      tone: e.event_type,
      isPrimary: e.event_type === "red_card" || e.event_type === "injury",
    });
  }

  return rows;
}

export function primaryEventDisplays(events: MatchEventRow[]): MatchEventDisplay[] {
  return buildMatchEventDisplays(events).filter((r) => r.isPrimary);
}

export function secondaryEventDisplays(events: MatchEventRow[]): MatchEventDisplay[] {
  return buildMatchEventDisplays(events).filter((r) => !r.isPrimary);
}
