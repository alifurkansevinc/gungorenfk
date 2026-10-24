import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  fetchMackolikHtml,
  listStandingsSeasons,
  parseStandingsFromHtml,
  standingsSeasonUrl,
  toStandingsPageUrl,
  type ParsedStandings,
} from "@/lib/mackolik-standings";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;
  const urlSecret = new URL(request.url).searchParams.get("secret");
  return urlSecret === secret;
}

async function readPostedHtml(request: Request): Promise<string | null> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  try {
    const body = (await request.json()) as { html?: unknown };
    if (typeof body.html === "string" && body.html.length > 1000) return body.html;
  } catch {
    return null;
  }
  return null;
}

async function saveSeason(
  supabase: ReturnType<typeof createClient<any>>,
  parsed: ParsedStandings,
): Promise<{ season: string; league_name: string; count: number } | { error: string; season: string }> {
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

  const { error: delErr } = await supabase.from("league_standings").delete().eq("season", parsed.season);
  if (delErr) return { error: delErr.message, season: parsed.season };
  const { error } = await supabase.from("league_standings").insert(toUpsert);
  if (error) return { error: error.message, season: parsed.season };
  return { season: parsed.season, league_name: parsed.league_name, count: toUpsert.length };
}

async function ingestHtml(
  supabase: ReturnType<typeof createClient<any>>,
  html: string,
): Promise<{ season: string; league_name: string; count: number } | { error: string; season: string }> {
  const parsed = parseStandingsFromHtml(html);
  if (!parsed) return { error: "Could not parse standings", season: "?" };
  return saveSeason(supabase, parsed);
}

/** Güncel ve geçmiş sezonların puan durumunu Mackolik’ten yazar. Maçlara dokunmaz. */
async function syncStandings(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not set" }, { status: 500 });
  }

  const supabase = createClient(url, serviceKey);
  let competitionFixed = 0;
  const { data: fixedRows, error: competitionErr } = await supabase
    .from("matches")
    .update({ competition: "Süper Amatör Lig", updated_at: new Date().toISOString() })
    .eq("competition", "Süper Lig")
    .select("id");
  if (!competitionErr) competitionFixed = fixedRows?.length ?? 0;

  const postedHtml = await readPostedHtml(request);
  if (postedHtml) {
    const result = await ingestHtml(supabase, postedHtml);
    if ("error" in result) {
      return NextResponse.json({ ok: false, ...result }, { status: 200 });
    }
    return NextResponse.json({ ok: true, saved: [result], failed: [], competitionFixed });
  }

  const { data: setting } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "mackolik_fixture_url")
    .maybeSingle();
  const stored = setting?.value;
  const base = toStandingsPageUrl(typeof stored === "string" ? stored : null);

  try {
    const indexHtml = await fetchMackolikHtml(base);
    const seasons = listStandingsSeasons(indexHtml);
    const targets = seasons.length > 0 ? seasons : [null];
    const saved: { season: string; league_name: string; count: number }[] = [];
    const failed: { season: string; error: string }[] = [];

    for (const season of targets) {
      try {
        const html = season ? await fetchMackolikHtml(standingsSeasonUrl(base, season)) : indexHtml;
        const parsed = parseStandingsFromHtml(html);
        if (!parsed) {
          failed.push({ season: season ?? "?", error: "Could not parse standings" });
          continue;
        }
        if (season) parsed.season = season;
        const result = await saveSeason(supabase, parsed);
        if ("error" in result) failed.push(result);
        else saved.push(result);
      } catch (err) {
        failed.push({
          season: season ?? "?",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    if (saved.length === 0) {
      return NextResponse.json({ ok: false, error: "Could not parse standings", failed }, { status: 200 });
    }
    return NextResponse.json({ ok: true, saved, failed, competitionFixed });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message, ok: false }, { status: 500 });
  }
}

export function GET(request: Request) {
  return syncStandings(request);
}

export function POST(request: Request) {
  return syncStandings(request);
}
