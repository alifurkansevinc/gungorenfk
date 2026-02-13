import Link from "next/link";
import Image from "next/image";
import { getSquad } from "@/lib/data";
import { PersonGallery } from "@/components/PersonGallery";
import type { PersonGalleryItem } from "@/components/PersonGallery";
import type { SquadMember } from "@/types/db";
import { DEMO_IMAGES } from "@/lib/demo-images";

function toGalleryItems(squad: SquadMember[]): PersonGalleryItem[] {
  const sorted = [...squad].sort((a, b) => a.sort_order - b.sort_order);
  return sorted.map((p) => {
    const parts: string[] = [];
    if (p.is_captain) parts.push("Kaptan");
    if (p.position) parts.push(p.position);
    if (p.shirt_number != null) parts.push(`#${p.shirt_number}`);
    const roleLabel = parts.length > 0 ? parts.join(" · ") : "Oyuncu";
    return {
      id: p.id,
      name: p.name,
      roleLabel,
      photo_url: p.photo_url,
    };
  });
}

export const metadata = {
  title: "Kadro | Güngören FK",
  description: "Güngören FK kadrosu: kaptanlar, kaleci, bekler, stoperler, orta saha, kanatlar, hücumcular.",
};

export default async function KadroPage() {
  const squad = await getSquad();
  const items = toGalleryItems(squad);

  return (
    <div className="min-h-screen bg-siyah">
      <section className="relative border-b border-beyaz/10 bg-siyah py-5 sm:py-6 text-beyaz overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image src={DEMO_IMAGES.team} alt="" fill className="object-cover" unoptimized />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-siyah/80 to-siyah" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6">
          <Link href="/kulup" className="text-sm font-medium text-beyaz/70 hover:text-beyaz transition-colors">
            ← Kulübümüz
          </Link>
          <h1 className="font-display mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Kadro
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {items.length > 0 ? (
          <PersonGallery items={items} placeholderImage={DEMO_IMAGES.portrait} />
        ) : (
          <p className="text-beyaz/60 py-12 text-center">Henüz oyuncu eklenmedi.</p>
        )}
      </div>
    </div>
  );
}
