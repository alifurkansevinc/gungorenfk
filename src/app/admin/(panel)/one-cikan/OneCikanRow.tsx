"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronUp, ChevronDown, Pencil, Trash2 } from "lucide-react";
import { moveHomepageFeatured, deleteHomepageFeatured } from "@/app/actions/admin";

type Item = {
  id: string;
  module_key: string;
  title: string | null;
  subtitle: string | null;
  image_url: string;
  link: string | null;
  is_large: boolean;
  sort_order: number;
};

export function OneCikanRow({
  item,
  index,
  total,
  defaultTitle,
  defaultSubtitle,
  defaultLink,
}: {
  item: Item;
  index: number;
  total: number;
  defaultTitle?: string;
  defaultSubtitle?: string;
  defaultLink?: string;
}) {
  const router = useRouter();
  const title = item.title || defaultTitle || item.module_key;
  const link = item.link || defaultLink || "#";

  async function moveUp() {
    if (index <= 0) return;
    await moveHomepageFeatured(item.id, "up");
    router.refresh();
  }

  async function moveDown() {
    if (index >= total - 1) return;
    await moveHomepageFeatured(item.id, "down");
    router.refresh();
  }

  async function remove() {
    if (!confirm(`"${title}" modülünü öne çıkan listesinden kaldırmak istediğinize emin misiniz?`)) return;
    const res = await deleteHomepageFeatured(item.id);
    if (res?.error) alert(res.error);
    else router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-siyah/10 bg-beyaz p-4">
      <div className="flex items-center gap-1">
        <button type="button" onClick={moveUp} disabled={index === 0} className="rounded p-1.5 text-siyah/60 hover:bg-siyah/10 hover:text-siyah disabled:opacity-30 min-touch" aria-label="Yukarı">
          <ChevronUp className="h-5 w-5" />
        </button>
        <button type="button" onClick={moveDown} disabled={index === total - 1} className="rounded p-1.5 text-siyah/60 hover:bg-siyah/10 hover:text-siyah disabled:opacity-30 min-touch" aria-label="Aşağı">
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-siyah/5">
        <Image src={item.image_url} alt="" fill className="object-cover" sizes="56px" unoptimized />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-siyah">{title}</p>
        {(item.subtitle || defaultSubtitle) && <p className="text-sm text-siyah/60">{item.subtitle || defaultSubtitle}</p>}
        <p className="text-xs text-siyah/50">{link}</p>
        {item.is_large && <span className="mt-1 inline-block rounded bg-bordo/20 px-2 py-0.5 text-xs font-medium text-bordo">Büyük kart</span>}
      </div>
      <div className="flex items-center gap-2">
        <Link href={`/admin/one-cikan/duzenle/${item.id}`} className="rounded p-2 text-siyah/70 hover:bg-siyah/10 hover:text-siyah min-touch" title="Düzenle">
          <Pencil className="h-4 w-4" />
        </Link>
        <button type="button" onClick={remove} className="rounded p-2 text-red-600 hover:bg-red-50 min-touch" title="Kaldır">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
