import Link from "next/link";
import { getTotalFanCount } from "@/lib/data";

/** Hero'dan hemen sonra görünen taraftar sayacı şeridi — sitede progress bar hep görünsün diye */
export async function TaraftarBarStrip() {
  const { total, target } = await getTotalFanCount();
  const percent = Math.min(100, (total / target) * 100);

  return (
    <section aria-label="Taraftar sayacı" className="border-y border-bordo/30 bg-siyah py-4 sm:py-5">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:flex-row sm:flex-wrap sm:items-center sm:px-6 lg:px-8">
        <div className="flex flex-1 flex-wrap items-center gap-3 sm:gap-4 min-w-0">
          <span className="font-display text-sm font-semibold uppercase tracking-wider text-beyaz/80 whitespace-nowrap">
            Taraftar ailesi
          </span>
          <span className="font-display text-2xl font-bold tabular-nums text-beyaz sm:text-3xl">
            {total.toLocaleString("tr-TR")}
            <span className="ml-1 text-lg font-medium text-beyaz/60 sm:text-xl">/ {target.toLocaleString("tr-TR")}</span>
          </span>
          <div className="flex-1 min-w-[120px] max-w-md h-3 overflow-hidden rounded-full bg-beyaz/20">
            <div
              className="progress-fill progress-bar-glow h-full rounded-full bg-gradient-to-r from-bordo to-bordo-dark"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <Link
          href="/#taraftar-bar"
          className="min-touch shrink-0 self-start rounded-sm border border-beyaz/30 bg-beyaz/10 px-4 py-3 text-sm font-semibold text-beyaz transition-colors hover:bg-bordo"
        >
          1000 Taraftar 1 Bayrak →
        </Link>
      </div>
    </section>
  );
}
