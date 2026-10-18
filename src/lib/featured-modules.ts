import { TICKETS_PUBLIC_ENABLED } from "@/lib/tickets-public";

/** Sitedeki modüller: öne çıkan bölümüne eklenebilir. Admin sadece bu listeden seçer. */
const FEATURED_MODULE_OPTIONS_ALL = [
  { key: "magaza", label: "Mağaza", link: "/magaza", defaultTitle: "Mağaza", defaultSubtitle: "Resmi ürünler" },
  { key: "bagis", label: "Bağış Yap", link: "/bagis", defaultTitle: "Bağış Yap", defaultSubtitle: "Destek ol" },
  { key: "kadro", label: "Kadro", link: "/kadro", defaultTitle: "Kadro", defaultSubtitle: "Takım" },
  { key: "biletler", label: "Biletler", link: "/biletler", defaultTitle: "Biletler", defaultSubtitle: "Maç ve etkinlik biletleri" },
  { key: "transferler", label: "Transferler", link: "/transferler", defaultTitle: "Transferler", defaultSubtitle: "Kadro hareketleri" },
  { key: "maclar", label: "Maçlar", link: "/maclar", defaultTitle: "Maçlar", defaultSubtitle: "Fikstür ve sonuçlar" },
  { key: "haberler", label: "Etkinlikler", link: "/haberler", defaultTitle: "Etkinlikler", defaultSubtitle: "Haberler" },
  { key: "kulup", label: "Kulüp", link: "/kulup", defaultTitle: "Kulüp", defaultSubtitle: "Kulübümüz" },
] as const;

export const FEATURED_MODULE_OPTIONS = (
  TICKETS_PUBLIC_ENABLED
    ? FEATURED_MODULE_OPTIONS_ALL
    : FEATURED_MODULE_OPTIONS_ALL.filter((m) => m.key !== "biletler")
) as readonly (typeof FEATURED_MODULE_OPTIONS_ALL)[number][];

export type FeaturedModuleKey = (typeof FEATURED_MODULE_OPTIONS_ALL)[number]["key"];

export function getModuleByKey(key: string) {
  return FEATURED_MODULE_OPTIONS_ALL.find((m) => m.key === key);
}
