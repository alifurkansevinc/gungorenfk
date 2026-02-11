/**
 * Demo mağaza ürünleri — spor kulübü mağazası tarzı (GS Store, Fenerium vb.).
 * Veritabanında ürün yokken veya slug eşleşmezse bu liste kullanılır. Backend (admin panel) gerçek ürünleri yönetir.
 */

const U = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80`;

export type DemoProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  image_url: string | null;
  sort_order: number;
};

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: "demo-resmi-forma",
    name: "Resmi Maç Forması",
    slug: "resmi-forma",
    description: "Güngören FK bordo-beyaz ana forma. Nefes alan kumaş, kulüp arması işlemeli. Erkek ve kadın beden seçenekleri. Sipariş için kulüp ile iletişime geçin.",
    price: "349.00",
    image_url: U("1551958012-5c2d615f1b54", 800, 800),
    sort_order: 1,
  },
  {
    id: "demo-ikinci-forma",
    name: "İkinci Forma (Deplasman)",
    slug: "ikinci-forma",
    description: "Deplasman maçlarında giyilen alternatif forma. Siyah ağırlıklı tasarım, bordo detaylar. Erkek/kadın beden.",
    price: "349.00",
    image_url: U("1571945153237-2d7fbcba2ad6", 800, 800),
    sort_order: 2,
  },
  {
    id: "demo-antrenman-formasi",
    name: "Antrenman Forması",
    slug: "antrenman-formasi",
    description: "Günlük kullanım ve antrenman için rahat kesim. Bordo ve siyah varyantlar. %100 polyester.",
    price: "199.00",
    image_url: U("1517836357463-d25dfeac3438", 800, 800),
    sort_order: 3,
  },
  {
    id: "demo-cocuk-formasi",
    name: "Çocuk Forması",
    slug: "cocuk-formasi",
    description: "Küçük taraftarlar için resmi forma. 4-14 yaş arası bedenler. Aynı bordo-beyaz tasarım.",
    price: "249.00",
    image_url: U("1551958012-5c2d615f1b54", 800, 800),
    sort_order: 4,
  },
  {
    id: "demo-atki",
    name: "Resmi Atkı",
    slug: "atki",
    description: "Bordo-beyaz kulüp atkısı. Tribün ve günlük kullanım için. %100 akrilik.",
    price: "79.00",
    image_url: U("1610550182178-49c448d0c8a2", 800, 600),
    sort_order: 5,
  },
  {
    id: "demo-sapka",
    name: "Kulüp Şapkası",
    slug: "sapka",
    description: "Güngören FK logosu işlemeli şapka. Tek beden, ayarlanabilir.",
    price: "59.00",
    image_url: U("1588850561407-4b1e2c2c30d3", 800, 800),
    sort_order: 6,
  },
  {
    id: "demo-yagmurluk",
    name: "Yağmurluk",
    slug: "yagmurluk",
    description: "Su geçirmez tribün yağmurluğu. Kulüp renkleri, kapüşonlu. Erkek/kadın beden.",
    price: "229.00",
    image_url: U("1544449850-31d0a2c94e5e", 800, 800),
    sort_order: 7,
  },
  {
    id: "demo-spor-cantasi",
    name: "Spor Çantası",
    slug: "spor-cantasi",
    description: "Antrenman ve maç günü için çok bölmeli spor çantası. Kulüp armalı.",
    price: "179.00",
    image_url: U("1553062407-547cac2f99c0", 800, 800),
    sort_order: 8,
  },
  {
    id: "demo-kislik-mont",
    name: "Kışlık Mont",
    slug: "kislik-mont",
    description: "Soğuk hava ve tribün için bordo mont. İç astarlı, kulüp logosu.",
    price: "449.00",
    image_url: U("1539533018447-63fcce2678e3", 800, 800),
    sort_order: 9,
  },
  {
    id: "demo-polo-tisort",
    name: "Polo Tişört",
    slug: "polo-tisort",
    description: "Günlük giyim için bordo veya siyah polo. Küçük kulüp logosu.",
    price: "149.00",
    image_url: U("1586790170083-2f106e4d668e", 800, 800),
    sort_order: 10,
  },
  {
    id: "demo-kaleci-eldiveni",
    name: "Kaleci Eldiveni",
    slug: "kaleci-eldiveni",
    description: "Resmi kaleci eldiveni. Bordo detaylı, profesyonel kavrama.",
    price: "149.00",
    image_url: U("1547347298-8b3c2a2f5c3d", 800, 800),
    sort_order: 11,
  },
  {
    id: "demo-takim-rozeti",
    name: "Takım Rozeti",
    slug: "takim-rozeti",
    description: "Koleksiyonluk kulüp rozeti. İğneli, metal.",
    price: "29.00",
    image_url: "https://placehold.co/600x600/8B1538/FFFFFF?text=Rozet",
    sort_order: 12,
  },
];

export function getDemoProductBySlug(slug: string): DemoProduct | undefined {
  return DEMO_PRODUCTS.find((p) => p.slug === slug);
}
