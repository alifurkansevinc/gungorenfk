import Link from "next/link";
import { SquadForm } from "../SquadForm";
import { defaultSeasonFromSearch } from "../AdminKadroClient";

export default async function AdminKadroYeniPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const { season } = await searchParams;
  const defaultSeason = defaultSeasonFromSearch(season);

  return (
    <div>
      <Link href="/admin/kadro" className="text-sm text-bordo hover:underline">
        ← Kadro listesi
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Yeni oyuncu</h1>
      <p className="mt-1 text-sm text-siyah/60">Sezon: {defaultSeason}</p>
      <SquadForm defaultSeason={defaultSeason} />
    </div>
  );
}
