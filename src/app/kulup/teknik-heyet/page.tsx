import Link from "next/link";
import Image from "next/image";
import { getTechnicalStaff } from "@/lib/data";
import { TECHNICAL_STAFF_ROLE_LABELS } from "@/lib/board-labels";
import { PersonGallery } from "@/components/PersonGallery";
import type { PersonGalleryItem } from "@/components/PersonGallery";
import type { TechnicalStaffMember } from "@/types/db";
import { DEMO_IMAGES } from "@/lib/demo-images";

function toGalleryItems(members: TechnicalStaffMember[]): PersonGalleryItem[] {
  return members.map((m) => ({
    id: m.id,
    name: m.name,
    roleLabel: TECHNICAL_STAFF_ROLE_LABELS[m.role_slug] ?? m.role_slug,
    photo_url: m.photo_url,
  }));
}

export const metadata = {
  title: "Teknik Heyet | Güngören FK",
  description: "Güngören FK teknik direktör, antrenörler ve kulüp yönetimi.",
};

export default async function TeknikHeyetPage() {
  const members = await getTechnicalStaff();
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
            Teknik Heyet
          </h1>
          <p className="mt-2 text-sm text-beyaz/80 max-w-2xl">
            Teknik direktör, antrenörler, futbol direktörü ve kulüp yönetimi.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <PersonGallery items={items} placeholderImage={DEMO_IMAGES.portrait} />
      </div>
    </div>
  );
}
