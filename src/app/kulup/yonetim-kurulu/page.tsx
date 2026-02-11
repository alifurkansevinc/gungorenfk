import Link from "next/link";
import Image from "next/image";
import { getBoardMembers } from "@/lib/data";
import { BOARD_ROLE_LABELS } from "@/lib/board-labels";
import { PersonGallery } from "@/components/PersonGallery";
import type { PersonGalleryItem } from "@/components/PersonGallery";
import type { BoardMember } from "@/types/db";
import { DEMO_IMAGES } from "@/lib/demo-images";

const ROLE_ORDER = ["baskan", "baskan_vekili", "as_baskan", "yk_uyesi", "yuksek_istisare_heyeti", "danisman"] as const;

function toGalleryItems(members: BoardMember[]): PersonGalleryItem[] {
  const orderMap = new Map<string, number>(ROLE_ORDER.map((s, i) => [s, i]));
  const sorted = [...members].sort((a, b) => {
    const ai = orderMap.get(a.role_slug) ?? 99;
    const bi = orderMap.get(b.role_slug) ?? 99;
    if (ai !== bi) return ai - bi;
    return a.sort_order - b.sort_order;
  });
  return sorted.map((m) => ({
    id: m.id,
    name: m.name,
    roleLabel: BOARD_ROLE_LABELS[m.role_slug] ?? m.role_slug,
    photo_url: m.photo_url,
  }));
}

export const metadata = {
  title: "Yönetim Kurulu | Güngören FK",
  description: "Güngören Belediye Spor Kulübü yönetim kurulu.",
};

export default async function YonetimKuruluPage() {
  const members = await getBoardMembers();
  const items = toGalleryItems(members);

  return (
    <div className="min-h-screen bg-siyah">
      <section className="relative border-b border-beyaz/10 bg-siyah py-8 sm:py-10 text-beyaz overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image src={DEMO_IMAGES.team} alt="" fill className="object-cover" unoptimized />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-siyah/80 to-siyah" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6">
          <Link href="/kulup" className="text-sm font-medium text-beyaz/70 hover:text-beyaz transition-colors">
            ← Kulüp
          </Link>
          <p className="font-display mt-3 text-xs font-semibold uppercase tracking-[0.25em] text-bordo">
            Kulüp
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Yönetim Kurulu
          </h1>
          <p className="mt-2 text-sm text-beyaz/80 max-w-2xl">
            Güngören Belediye Spor Kulübü yönetim kurulu, yüksek istişare heyeti ve danışmanlar.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <PersonGallery items={items} placeholderImage={DEMO_IMAGES.portrait} />
      </div>
    </div>
  );
}
