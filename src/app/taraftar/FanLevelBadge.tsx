type Props = { levelSlug: string; levelName: string };

const colors: Record<string, string> = {
  "as-oyuncu": "bg-slate-200 text-slate-800",
  maestro: "bg-amber-100 text-amber-900",
  kapitano: "bg-bordo/20 text-bordo-dark",
  general: "bg-siyah/10 text-siyah",
  efsane: "bg-gradient-to-r from-amber-200 to-amber-400 text-amber-950",
  // Eski slug’lar (migration öncesi)
  beyaz: "bg-slate-200 text-slate-800",
  bronz: "bg-amber-200 text-amber-900",
  gumus: "bg-gray-300 text-gray-800",
  altin: "bg-amber-400 text-amber-900",
  platinium: "bg-slate-300 text-slate-800",
};

export function FanLevelBadge({ levelSlug, levelName }: Props) {
  const cls = colors[levelSlug] ?? colors["as-oyuncu"];
  return (
    <div className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${cls}`}>
      🏅 {levelName}
    </div>
  );
}
