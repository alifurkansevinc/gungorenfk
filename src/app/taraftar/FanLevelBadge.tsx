type Props = { levelSlug: string; levelName: string };

const colors: Record<string, string> = {
  beyaz: "bg-gray-200 text-siyah",
  bronz: "bg-amber-200 text-amber-900",
  gumus: "bg-gray-300 text-gray-800",
  altin: "bg-amber-400 text-amber-900",
  platinium: "bg-slate-300 text-slate-800",
};

export function FanLevelBadge({ levelSlug, levelName }: Props) {
  const cls = colors[levelSlug] ?? colors.beyaz;
  return (
    <div className={`mt-2 inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${cls}`}>
      🏅 {levelName}
    </div>
  );
}
