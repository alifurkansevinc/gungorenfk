/**
 * Mackolik takım fikstür sayfasından maç listesi çeker.
 * Kaynak: https://www.mackolik.com/takim/güngören-belediyesi-spor-kulübü/maçlar/macko17420477681804340168
 * Önbellek: 1 saat (isteğe bağlı).
 */

import * as cheerio from "cheerio";

// Türkçe karakterli path: güngören-belediyesi-spor-kulübü/maçlar (encode edilmiş)
const MACKOLIK_URL = "https://www.mackolik.com/takim/g%C3%BCng%C3%B6ren-belediyesi-spor-kul%C3%BCb%C3%BC/ma%C3%A7lar/macko17420477681804340168";
const CACHE_MS = 60 * 60 * 1000; // 1 saat
let cached: { matches: MackolikMatch[]; at: number } | null = null;

export type MackolikMatch = {
  date: string;
  home: string;
  away: string;
  goalsHome: number | null;
  goalsAway: number | null;
  competition?: string;
  matchUrl?: string;
};

function normalizeTeamName(s: string): string {
  return s.replace(/\s+/g, " ").trim();
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

export async function getMackolikMatches(): Promise<MackolikMatch[]> {
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.matches;

  try {
    const res = await fetch(MACKOLIK_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GüngörenFK/1.0)" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);
    const matches: MackolikMatch[] = [];

    // Mackolik fikstür: maç linkleri /mac/ içerir; tarih link metninde (12.10 2025), skor/takımlar parent veya komşu elemanda
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
      const p = $el.parent();
      const pText = p.length ? p.text().replace(/\s+/g, " ") : "";
      const gpText = p.parent().length ? p.parent().text().replace(/\s+/g, " ") : "";
      const nextSibs = p.nextAll().length ? p.nextAll().toArray().map((n) => $(n).text()).join(" ").replace(/\s+/g, " ") : "";
      const scoreText = [pText, gpText, nextSibs].find((t) => t.length > 0 && t.length < 500) || pText || gpText;
      const scoreMatch = scoreText.match(/(\d+)\s*[-–]\s*(\d+)/);
      if (scoreMatch) {
        goalsHome = parseInt(scoreMatch[1], 10);
        goalsAway = parseInt(scoreMatch[2], 10);
      }

      // Takım isimleri: maç URL'den (örn. güngören-bld-vs-yeşilova-esnaf)
      const teams = parseTeamNamesFromMacUrl(href);
      const home = teams?.home ?? "Güngören Bld";
      const away = teams?.away ?? "Rakip";

      matches.push({
        date: dateStr,
        home,
        away,
        goalsHome,
        goalsAway,
        matchUrl: href.startsWith("http") ? href : `https://www.mackolik.com${href.startsWith("/") ? "" : "/"}${href}`,
      });
    });

    // Alternatif: script içinde JSON veri (Mackolik bazen __NEXT_DATA__ veya benzeri kullanır)
    const scriptJson = $('script#__NEXT_DATA__').html();
    if (scriptJson && matches.length === 0) {
      try {
        const data = JSON.parse(scriptJson);
        const fixtures = data?.props?.pageProps?.data?.fixtures ?? data?.props?.pageProps?.fixtures ?? [];
        for (const f of fixtures) {
          const start = f?.startDate ?? f?.date;
          const homeTeam = f?.homeTeam?.name ?? f?.home?.name ?? "";
          const awayTeam = f?.awayTeam?.name ?? f?.away?.name ?? "";
          const score = f?.score ?? f?.result;
          const goalsHome = score?.home != null ? Number(score.home) : null;
          const goalsAway = score?.away != null ? Number(score.away) : null;
          if (start && (homeTeam || awayTeam)) {
            const d = new Date(start);
            matches.push({
              date: d.toISOString().slice(0, 10),
              home: homeTeam || "Güngören Bld",
              away: awayTeam || "Rakip",
              goalsHome,
              goalsAway,
              competition: f?.competition?.name ?? f?.league?.name,
            });
          }
        }
      } catch {
        // ignore
      }
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

    cached = { matches: unique, at: Date.now() };
    return unique;
  } catch {
    return cached?.matches ?? [];
  }
}
