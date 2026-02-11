/** Demo görseller: Unsplash (gerçek fotoğraflar) + placehold.co ürün için. */
const U = (id: string, w: number, h: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&q=80`;

export const DEMO_IMAGES = {
  hero: U("1574629810360-7efbbe195018", 1920, 900),
  stadium: U("1522778119026-d647f0596c20", 1200, 600),
  match: U("1579952363873-27f3bade9f55", 1200, 600),
  team: U("1543326727-cf6c39e8f84c", 800, 600),
  news: U("1508098682722-e3c8f1c2272a", 800, 450),
  taraftar: U("1431324155629-1a6e6735895b", 800, 600),
  product: "https://placehold.co/600x600/0A0A0A/FFFFFF?text=GFK",
  kadro: U("1543326727-cf6c39e8f84c", 400, 400),
  /** Yönetim kurulu / teknik heyet placeholder portre */
  portrait: U("1560250097-0b93528c311a", 400, 400),
  /** Kadro küçük kart (kare) */
  playerCard: U("1579952363873-27f3bade9f55", 300, 300),
} as const;
