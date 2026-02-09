import { getSquad } from "@/lib/data";
import Image from "next/image";

export const metadata = {
  title: "Kadro | Güngören FK",
  description: "Güngören FK kadrosu.",
};

export default async function KadroPage() {
  const squad = await getSquad();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-siyah sm:text-3xl">Kadro</h1>
      <p className="mt-2 text-siyah/70">Takım kadromuz.</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {squad.length === 0 ? (
          <p className="col-span-full text-siyah/60">Henüz oyuncu eklenmedi.</p>
        ) : (
          squad.map((p) => (
            <div key={p.id} className="rounded-xl border border-black/10 overflow-hidden bg-beyaz text-center">
              <div className="aspect-square relative bg-siyah/10">
                {p.photo_url ? (
                  <Image src={p.photo_url} alt={p.name} fill className="object-cover" unoptimized />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-4xl text-siyah/30">?</span>
                )}
              </div>
              <div className="p-3">
                {p.shirt_number != null && <span className="text-sm font-bold text-bordo">#{p.shirt_number}</span>}
                <h2 className="font-semibold text-siyah">{p.name}</h2>
                {p.position && <p className="text-sm text-siyah/70">{p.position}</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
