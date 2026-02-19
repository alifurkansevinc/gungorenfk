/** Sitedeki modüller: öne çıkan bölümüne eklenebilir. Admin sadece bu listeden seçer. */
export const FEATURED_MODULE_OPTIONS = [
  { key: "magaza", label: "Mağaza", link: "/magaza", defaultTitle: "Mağaza", defaultSubtitle: "Resmi ürünler" },
  { key: "bagis", label: "Bağış Yap", link: "/bagis", defaultTitle: "Bağış Yap", defaultSubtitle: "Destek ol" },
  { key: "kadro", label: "Kadro", link: "/kadro", defaultTitle: "Kadro", defaultSubtitle: "Takım" },
  { key: "biletler", label: "Maç Biletleri", link: "/biletler", defaultTitle: "Maç Biletleri", defaultSubtitle: "Bilet al" },
  { key: "transferler", label: "Transferler", link: "/transferler", defaultTitle: "Transferler", defaultSubtitle: "Kadro hareketleri" },
  { key: "maclar", label: "Maçlar", link: "/maclar", defaultTitle: "Maçlar", defaultSubtitle: "Fikstür ve sonuçlar" },
  { key: "haberler", label: "Etkinlikler", link: "/haberler", defaultTitle: "Etkinlikler", defaultSubtitle: "Haberler" },
  { key: "kulup", label: "Kulüp", link: "/kulup", defaultTitle: "Kulüp", defaultSubtitle: "Kulübümüz" },
] as const;

export type FeaturedModuleKey = (typeof FEATURED_MODULE_OPTIONS)[number]["key"];

export function getModuleByKey(key: string) {
  return FEATURED_MODULE_OPTIONS.find((m) => m.key === key);
}
