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
      const parent = $el.closest("tr, [class*='match'], [class*='row'], [class*='fixture'], section, div");
      const rowText = (parent.length ? parent.first().text() : linkText).replace(/\s+/g, " ").trim();

      // Tarih: önce link metninden (12.10 2025), yoksa row’dan
      const dateSource = linkText.match(/(\d{1,2})\.(\d{1,2})\s*(?:\s(\d{4}))?/) ? linkText : rowText;
      const dateMatch = dateSource.match(/(\d{1,2})\.(\d{1,2})\s*(?:\s(\d{4}))?/);
      if (!dateMatch) return;

      const day = dateMatch[1];
      const month = dateMatch[2];
      const year = dateMatch[3] ?? new Date().getFullYear().toString();
      const dateStr = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

      const scoreMatch = rowText.match(/(\d+)\s*-\s*(\d+)/);
      let goalsHome: number | null = null;
      let goalsAway: number | null = null;
      if (scoreMatch) {
        goalsHome = parseInt(scoreMatch[1], 10);
        goalsAway = parseInt(scoreMatch[2], 10);
      }

      // Takım isimleri: skor etrafındaki metinden (Güngören Bld, Yeşilova Esnaf vb.)
      const parts = rowText.split(/\d+\s*-\s*\d+/);
      const beforeScore = (parts[0] ?? "").trim();
      const afterScore = (parts[1] ?? "").trim();
      const teamNames = [...beforeScore.split(/\s{2,}/), ...afterScore.split(/\s{2,}/)].map((s) => normalizeTeamName(s)).filter((s) => s.length > 1 && !/^\d+$/.test(s));
      const home = (teamNames[0] && teamNames[0].length > 1) ? teamNames[0] : "Güngören Bld";
      const away = (teamNames[1] && teamNames[1].length > 1) ? teamNames[1] : (teamNames[2] && teamNames[2].length > 1) ? teamNames[2] : "Rakip";

      if (!home || !away) return;

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
