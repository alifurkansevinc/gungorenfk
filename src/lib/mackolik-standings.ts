import * as cheerio from "cheerio";

/** Takım puan durumu sayfası. Sezon: ?s=2025/2026 */
export const DEFAULT_MACKOLIK_STANDINGS_URL =
  "https://www.mackolik.com/takim/gungoren-belediyesi-spor-kulubu/puan-durumu/macko17420477681804340168";

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export type MackolikStandingRow = {
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

export type ParsedStandings = {
  league_name: string;
  season: string;
  rows: MackolikStandingRow[];
};

function parseNum(s: string): number {
  const n = parseInt(s.replace(/\s/g, "").replace(/^\+/, ""), 10);
  return Number.isNaN(n) ? 0 : n;
}

/** Admin’deki fikstür linkini de puan durumu sayfasına çevirir. */
export function toStandingsPageUrl(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("http")) return DEFAULT_MACKOLIK_STANDINGS_URL;
  try {
    const u = new URL(raw);
    const path = decodeURIComponent(u.pathname).replace(/\/(maçlar|maclar)\//i, "/puan-durumu/");
    u.pathname = path;
    u.searchParams.delete("s");
    u.hash = "";
    return u.toString();
  } catch {
    return DEFAULT_MACKOLIK_STANDINGS_URL;
  }
}

export function standingsSeasonUrl(base: string, season: string): string {
  const u = new URL(base);
  u.searchParams.delete("s");
  const qs = u.searchParams.toString();
  const path = `${u.origin}${u.pathname}${qs ? `?${qs}&` : "?"}s=${season}`;
  return path;
}

/** Sezon açılır listesi, yeni sezon önce (sayfadaki sıra). */
export function listStandingsSeasons(html: string): string[] {
  const $ = cheerio.load(html);
  const seasons: string[] = [];
  $(".page-team__dropdown--season option").each((_, el) => {
    const v = $(el).attr("value")?.trim() ?? "";
    if (/^\d{4}\/\d{4}$/.test(v) && !seasons.includes(v)) seasons.push(v);
  });
  return seasons;
}

/**
 * Mackolik puan tablosu.
 * Sütunlar: #, sıra değişimi, takım, O, +/-, G, B, M, A, Y, Av, P.
 */
export function parseStandingsFromHtml(html: string): ParsedStandings | null {
  const $ = cheerio.load(html);
  const season =
    $(".page-team__dropdown--season option[selected]").attr("value")?.trim() ||
    $(".page-team__dropdown--season option").first().attr("value")?.trim() ||
    html.match(/\b(20\d{2}\/20\d{2})\b/)?.[1] ||
    "";
  const leagueName = $("h2").first().text().replace(/\s+/g, " ").trim() || "Puan durumu";

  const rows: MackolikStandingRow[] = [];
  $("tr[data-team-name]").each((_, el) => {
    const team = $(el).attr("data-team-name")?.replace(/\s+/g, " ").trim() ?? "";
    if (!team) return;
    const position = parseNum($(el).find(".p0c-competition-tables__rank").first().text());
    const nums = $(el)
      .find("td")
      .toArray()
      .slice(3)
      .map((td) => parseNum($(td).text()));
    if (nums.length < 9 || position <= 0) return;
    rows.push({
      position,
      team_name: team,
      played: nums[0] ?? 0,
      goal_diff: nums[1] ?? 0,
      wins: nums[2] ?? 0,
      draws: nums[3] ?? 0,
      losses: nums[4] ?? 0,
      goals_for: nums[5] ?? 0,
      goals_against: nums[6] ?? 0,
      points: nums[8] ?? 0,
    });
  });

  if (!season || rows.length === 0) return null;
  return { league_name: leagueName, season, rows };
}

export async function fetchMackolikHtml(url: string): Promise<string> {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "tr-TR,tr;q=0.9",
      },
      cache: "no-store",
    });
    if (res.ok) return res.text();
    lastStatus = res.status;
    if (res.status < 500) break;
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
  }
  throw new Error(`Mackolik ${lastStatus}`);
}
