/**
 * Mackolik takım fikstür sayfasından maç listesi çeker.
 * Kaynak: https://www.mackolik.com/takim/güngören-belediyesi-spor-kulübü/maçlar/macko17420477681804340168
 * Önbellek: 1 saat (isteğe bağlı).
 */

import * as cheerio from "cheerio";

// Varsayılan link (admin panelinden değiştirilebilir)
const DEFAULT_MACKOLIK_URL = "https://www.mackolik.com/takim/g%C3%BCng%C3%B6ren-belediyesi-spor-kul%C3%BCb%C3%BC/ma%C3%A7lar/macko17420477681804340168";
const CACHE_MS = 60 * 60 * 1000; // 1 saat
const cacheByUrl = new Map<string, { matches: MackolikMatch[]; at: number }>();

export type MackolikMatch = {
  date: string;
  home: string;
  away: string;
  goalsHome: number | null;
  goalsAway: number | null;
  competition?: string;
  matchUrl?: string;
  /** Tarih geçmişse 'finished', gelecekteyse 'scheduled' */
  status: "finished" | "scheduled";
};

function normalizeTeamName(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

const TODAY = () => new Date().toISOString().slice(0, 10);

/** Objeden skor çıkar (Mackolik farklı alan adları kullanabiliyor). */
function extractScore(obj: unknown): { home: number | null; away: number | null } {
  if (!obj || typeof obj !== "object") return { home: null, away: null };
  const o = obj as Record<string, unknown>;
  const home =
    typeof o.home === "number" ? o.home : o.homeTeam != null ? Number(o.homeTeam) : null;
  const away =
    typeof o.away === "number" ? o.away : o.awayTeam != null ? Number(o.awayTeam) : null;
  if (home != null && !Number.isNaN(home) && away != null && !Number.isNaN(away))
    return { home, away };
  return { home: null, away: null };
}

/** __NEXT_DATA__ içinde fixture benzeri objeleri recursive arar. */
function collectFixturesFromJson(obj: unknown, out: MackolikMatch[], todayStr: string): void {
  if (!obj) return;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (item && typeof item === "object") {
        const x = item as Record<string, unknown>;
        const start = x.startDate ?? x.startTime ?? x.date;
        const ht = x.homeTeam as { name?: string; shortName?: string } | undefined;
        const at = x.awayTeam as { name?: string; shortName?: string } | undefined;
        const homeTeam = ht?.name ?? ht?.shortName ?? (x.home as { name?: string })?.name ?? "";
        const awayTeam = at?.name ?? at?.shortName ?? (x.away as { name?: string })?.name ?? "";
        if (start && (homeTeam || awayTeam)) {
          const d = new Date(start as string);
          const dateStr = d.toISOString().slice(0, 10);
          const score =
            extractScore(x.score).home != null
              ? extractScore(x.score)
              : extractScore(x.result).home != null
                ? extractScore(x.result)
                : extractScore((x as { regularScore?: unknown }).regularScore ?? (x as { fullTimeScore?: unknown }).fullTimeScore ?? (x as { status?: { score?: unknown } }).status?.score);
          const goalsHome = score.home;
          const goalsAway = score.away;
          const competition =
            (x.competition as { name?: string })?.name ??
            (x.league as { name?: string })?.name ??
            (x.tournament as { name?: string })?.name;
          out.push({
            date: dateStr,
            home: homeTeam || "Güngören Bld",
            away: awayTeam || "Rakip",
            goalsHome: goalsHome ?? null,
            goalsAway: goalsAway ?? null,
            competition: competition ?? undefined,
            status: dateStr < todayStr ? "finished" : "scheduled",
          });
          continue;
        }
      }
      collectFixturesFromJson(item, out, todayStr);
    }
    return;
  }
  if (typeof obj === "object") {
    for (const v of Object.values(obj)) collectFixturesFromJson(v, out, todayStr);
  }
}

/** Maç URL slug'ından takım isimlerini çıkar: güngören-bld-vs-yeşilova-esnaf → ["Güngören Bld", "Yeşilova Esnaf"] */
function parseTeamNamesFromMacUrl(href: string): { home: string; away: string } | null {
  try {
    const path = href.includes("/mac/") ? href.split("/mac/")[1]?.split("/")[0] ?? "" : "";
    if (!path || !path.includes("-vs-")) return null;
    const [homeSlug, awaySlug] = path.split("-vs-");
    if (!homeSlug || !awaySlug) return null;
    const toTitle = (s: string) => {
      const decoded = decodeURIComponent(s).replace(/-/g, " ");
      return decoded.replace(/(^| )\S/g, (c) => c.toUpperCase());
    };
    return { home: toTitle(homeSlug), away: toTitle(awaySlug) };
  } catch {
    return null;
  }
}

/**
 * Mackolik fikstür sayfasından maç listesini çeker.
 * @param overrideUrl Admin'den gelen veya site_settings'teki URL; boşsa varsayılan kullanılır. Link değişince sayfa yapısı aynıysa entegre çalışır.
 */
export async function getMackolikMatches(overrideUrl?: string | null): Promise<MackolikMatch[]> {
  const url = (overrideUrl && overrideUrl.startsWith("http")) ? overrideUrl : DEFAULT_MACKOLIK_URL;
  const cached = cacheByUrl.get(url);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.matches;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GüngörenFK/1.0)" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const matches: MackolikMatch[] = [];
    const todayStr = TODAY();

    // Önce __NEXT_DATA__: skor ve maç listesi burada; tüm JSON ağacında fixture benzeri objeleri ara
    const scriptJson = $('script#__NEXT_DATA__').html();
    if (scriptJson) {
      try {
        const data = JSON.parse(scriptJson);
        collectFixturesFromJson(data, matches, todayStr);
      } catch {
        // ignore
      }
    }

    // HTML'deki maç linkleri (__NEXT_DATA__ boşsa kullan)
    if (matches.length === 0) {
    $("a[href*='/mac/']").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href") ?? "";
      const linkText = $el.text().replace(/\s+/g, " ").trim();

      const dateMatch = linkText.match(/(\d{1,2})\.(\d{1,2})\s*(?:\s(\d{4}))?/);
      if (!dateMatch) return;

      const day = dateMatch[1];
      const month = dateMatch[2];
      const year = dateMatch[3] ?? new Date().getFullYear().toString();
      const dateStr = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

      let goalsHome: number | null = null;
      let goalsAway: number | null = null;
      // Skor: önce tarih linkinin sonraki kardeşlerinde (nextAll), sonra üst container'da "X - Y" ara
      const $next = $el.parent().nextAll().addBack().parent();
      let searchText = "";
      if ($next.length) searchText = $next.first().text().replace(/\s+/g, " ").trim();
      if (!searchText || searchText.length > 600) {
        let $container = $el.closest("tr");
        if (!$container.length) {
          let $p: ReturnType<typeof $el.parent> = $el.parent();
          for (let i = 0; i < 10 && $p.length; i++) {
            const t = $p.text();
            if (t.includes(" - ") && /\d+\s*[-–]\s*\d+/.test(t) && t.length < 1000) {
              $container = $p;
              break;
            }
            $p = $p.parent();
          }
        }
        searchText = $container.length ? $container.text().replace(/\s+/g, " ").trim() : "";
      }
      const scoreMatch = searchText.match(/(\d+)\s*[-–]\s*(\d+)/);
      if (scoreMatch) {
        const a = parseInt(scoreMatch[1], 10);
        const b = parseInt(scoreMatch[2], 10);
        if (a >= 0 && a <= 20 && b >= 0 && b <= 20) {
          goalsHome = a;
          goalsAway = b;
        }
      }

      // Takım isimleri: maç URL'den (örn. güngören-bld-vs-yeşilova-esnaf)
      const teams = parseTeamNamesFromMacUrl(href);
      const home = teams?.home ?? "Güngören Bld";
      const away = teams?.away ?? "Rakip";

      // Müsabaka: tablonun hemen öncesindeki başlık/div (sayfa yapısına göre)
      let competition: string | undefined;
      const $table = $el.closest("table");
      if ($table.length) {
        const prevText = $table.prev().text().trim();
        if (prevText && prevText.length < 200) competition = prevText;
      }

      matches.push({
        date: dateStr,
        home,
        away,
        goalsHome,
        goalsAway,
        competition,
        matchUrl: href.startsWith("http") ? href : `https://www.mackolik.com${href.startsWith("/") ? "" : "/"}${href}`,
        status: dateStr < todayStr ? "finished" : "scheduled",
      });
    });
    }

    // Tekil kayıtları tarih ve skora göre sırala; tekrarları kaldır
    const seen = new Set<string>();
    const unique = matches.filter((m) => {
      const key = `${m.date}-${m.home}-${m.away}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    unique.sort((a, b) => b.date.localeCompare(a.date)); // en yeni üstte

    cacheByUrl.set(url, { matches: unique, at: Date.now() });
    return unique;
  } catch {
    return cacheByUrl.get(url)?.matches ?? [];
  }
}
