/** Juventus tarzı yerlerde kullanılan demo görseller (placehold.co). */
const BASE = "https://placehold.co";
const BORDO = "8B1538";
const SİYAH = "0A0A0A";
const Beyaz = "FFFFFF";

export const DEMO_IMAGES = {
  hero: `${BASE}/1920x800/${SİYAH}/${Beyaz}?text=Güngören+FK&font=inter`,
  stadium: `${BASE}/1200x600/${BORDO}/${Beyaz}?text=Stadyum`,
  match: `${BASE}/1200x500/${SİYAH}/${Beyaz}?text=Maç+Günü`,
  team: `${BASE}/800x600/${BORDO}/${Beyaz}?text=Kadro`,
  news: `${BASE}/800x450/${SİYAH}/${Beyaz}?text=Gelişmeler`,
  taraftar: `${BASE}/800x600/${BORDO}/${Beyaz}?text=Taraftar`,
  product: `${BASE}/600x600/${SİYAH}/FFFFFF?text=Ürün`,
  kadro: `${BASE}/400x400/${BORDO}/${Beyaz}?text=Oyuncu`,
} as const;
