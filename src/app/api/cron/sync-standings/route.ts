import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

const MACKOLIK_URL =
  "https://www.mackolik.com/takim/gungoren-belediyesi-spor-kulubu/puan-durumu/macko17420477681804340168";

type StandingRow = {
  position: number;
  team_name: string;
  played: number;
  goal_diff: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  points: number;
};

function parseNum(s: string): number {
  const n = parseInt(s.replace(/\s/g, ""), 10);
  return Number.isNaN(n) ? 0 : n;
}

/** HTML veya __NEXT_DATA__ içinden puan durumu çıkar. */
function parseStandingsFromHtml(html: string): { league_name: string; season: string; rows: StandingRow[] } | null {
  const $ = cheerio.load(html);

  // __NEXT_DATA__ script varsa JSON'dan çek (Mackolik Next kullanıyor olabilir)
  const nextData = $("script#__NEXT_DATA__").html();
  if (nextData) {
    try {
      const json = JSON.parse(nextData) as { props?: { pageProps?: { data?: unknown } } };
      const data = json?.props?.pageProps?.data;
      if (data && typeof data === "object" && "standings" in data) {
        const standings = (data as { standings?: { table?: unknown[] } }).standings?.table;
        if (Array.isArray(standings) && standings.length > 0) {
          const table = standings[0] as { name?: string; season?: string; table?: { position?: number; team?: { name?: string }; played?: number; goalDifference?: number; won?: number; draw?: number; lost?: number; goalsFor?: number; goalsAgainst?: number; points?: number }[] };
          const rows: StandingRow[] = (table.table ?? []).map((r) => ({
            position: r.position ?? 0,
            team_name: r.team?.name ?? "",
            played: r.played ?? 0,
            goal_diff: r.goalDifference ?? 0,
            wins: r.won ?? 0,
            draws: r.draw ?? 0,
            losses: r.lost ?? 0,
            goals_for: r.goalsFor ?? 0,
            goals_against: r.goalsAgainst ?? 0,
            points: r.points ?? 0,
          }));
          if (rows.length > 0 && rows[0].team_name) {
            return {
              league_name: table.name ?? "İstanbul - 1. Amatör Lig - 5. Grup",
              season: table.season ?? "2025/2026",
              rows,
            };
          }
        }
      }
    } catch {
      // ignore JSON parse errors
    }
  }

  // Tablo satırlarını HTML'den tara (fallback)
  const leagueName =
    $("h2").first().text().trim() || "İstanbul - 1. Amatör Lig - 5. Grup";
  const seasonMatch = html.match(/202[45]\/202[56]/);
  const season = seasonMatch ? seasonMatch[0] : "2025/2026";
  const rows: StandingRow[] = [];
  $("table tbody tr").each((_, el) => {
    const cells = $(el).find("td");
    const n = cells.length;
    if (n >= 10) {
      const teamCell = $(cells[1]).find("a").text().trim() || $(cells[1]).text().trim();
      if (!teamCell) return;
      const pointsCol = n >= 11 ? 10 : 9;
      rows.push({
        position: parseNum($(cells[0]).text()),
        team_name: teamCell.replace(/\s+/g, " "),
        played: parseNum($(cells[2]).text()),
        goal_diff: parseNum($(cells[3]).text()),
        wins: parseNum($(cells[4]).text()),
        draws: parseNum($(cells[5]).text()),
        losses: parseNum($(cells[6]).text()),
        goals_for: parseNum($(cells[7]).text()),
        goals_against: parseNum($(cells[8]).text()),
        points: parseNum($(cells[pointsCol]).text()),
      });
    }
  });
  if (rows.length > 0) return { league_name: leagueName, season, rows };
  return null;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    const urlSecret = new URL(request.url).searchParams.get("secret");
    if (urlSecret !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY not set" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(MACKOLIK_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; GüngörenFK-Bot/1.0; +https://gungorenfk.com)",
        "Accept-Language": "tr-TR,tr;q=0.9",
      },
    });
    const html = await res.text();
    const parsed = parseStandingsFromHtml(html);
    if (!parsed || parsed.rows.length === 0) {
      return NextResponse.json(
        { error: "Could not parse standings", ok: false },
        { status: 200 }
      );
    }

    const supabase = createClient(url, serviceKey);
    const toUpsert = parsed.rows.map((r) => ({
      league_name: parsed.league_name,
      season: parsed.season,
      position: r.position,
      team_name: r.team_name,
      played: r.played,
      goal_diff: r.goal_diff,
      wins: r.wins,
      draws: r.draws,
      losses: r.losses,
      goals_for: r.goals_for,
      goals_against: r.goals_against,
      points: r.points,
      updated_at: new Date().toISOString(),
    }));

    // Aynı lig+sezon için önce silip tekrar ekleyebiliriz veya upsert
    await supabase.from("league_standings").delete().eq("league_name", parsed.league_name).eq("season", parsed.season);
    const { error } = await supabase.from("league_standings").insert(toUpsert);
    if (error) {
      return NextResponse.json({ error: error.message, ok: false }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      count: toUpsert.length,
      league_name: parsed.league_name,
      season: parsed.season,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message, ok: false }, { status: 500 });
  }
}
