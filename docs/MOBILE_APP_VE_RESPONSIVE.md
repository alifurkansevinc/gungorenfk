# Mobil uygulama ve mobil uyumluluk

## Mobil uygulama yapma şansı — kodlar uygun mu?

**Evet. Mevcut yapı mobil uygulama için uygun.**

- **Backend / veri:** Supabase (Auth, DB, Storage) platform bağımsız. Aynı API’yi web ve mobil uygulama aynı anda kullanabilir.
- **Mantık:** Taraftar kaydı, rozet, maçlar, mağaza, haberler hepsi Supabase üzerinden; mobil uygulama da aynı tablolara ve Auth’a bağlanabilir.

### İleride mobil uygulama seçenekleri

1. **PWA (Progressive Web App)**  
   Mevcut Next.js sitesi PWA’ya dönüştürülebilir: manifest, service worker, “Ana ekrana ekle”. Kullanıcı siteyi telefonunda uygulama gibi açabilir. **Ek kod: aynı proje, manifest + SW.**

2. **React Native / Expo**  
   Ayrı bir mobil proje (React Native veya Expo) açıp **aynı Supabase projesine** bağlanırsın. Auth, `store_products`, `fan_profiles`, `matches` vb. aynı. Sadece UI mobil bileşenlerle (View, TouchableOpacity) yazılır; API ve iş kuralları paylaşılır veya ortak bir pakette toplanabilir.

3. **Capacitor / Cordova**  
   Mevcut web uygulamasını bir “kabuk” içinde paketleyip mağazaya (App Store / Play Store) koymak. Yine aynı kod tabanı, ekstra native erişim (bildirim, kamera vb.) gerekirse eklenir.

**Özet:** Veritabanı ve API tarafı mobil uygulama için hazır. İstersen önce web’i PWA yapıp “uygulama gibi” kullanıma alabilirsin; sonra tam native istersen React Native ile aynı backend’i kullanırsın.

---

## Mobil uyumluluk (mobile-first)

Tüm sayfalar ve özellikler **mobilde tam uyumlu** olacak şekilde tasarlanıyor; öncelik **mobil** (küçük ekran, dokunmatik).

### Yapılanlar (kodda uygulandı)

- **Viewport ve tema:** `src/app/layout.tsx` — `viewport` export (device-width, initialScale, themeColor #0A0A0A).
- **Yatay taşma:** `src/app/globals.css` — `html` ve `body` için `overflow-x-hidden`; dokunmatik hedefler için `.min-touch` sınıfı (44px).
- **Header:** Hamburger butonu `min-h-[44px] min-w-[44px]`; mobil menü linkleri `py-4`.
- **TaraftarBarStrip:** Küçük ekranda dikey düzen (`flex-col sm:flex-row`), CTA’da `min-touch`.
- **Tablolar:** Maçlar sayfası tablosu `overflow-x-auto` + `min-w-[520px]`; admin mağaza/taraftarlar tabloları `overflow-x-auto` + `min-w-*`.
- **Genel:** Grid’ler `grid-cols-1 sm:grid-cols-2 lg:grid-cols-*`; formlar tek sütun; başlık/metin `sm:text-*` ile mobilde okunaklı.

### Geliştirme kuralı

Yeni sayfa veya bileşen eklerken:

- Önce **mobil** (örn. 375px) genişlikte düşün; sonra `sm:`, `md:`, `lg:` ile masaüstüne çık.
- Tıklanabilir alanları küçük ekranda da en az 44px yükseklikte tut.
- Sayfada yatay scroll çıkmamasına dikkat et (gerekirse `max-w-full`, `overflow-hidden` veya `overflow-x-auto` sadece tablo için).

Bu sayede site hem mobil tarayıcıda hem de ileride PWA veya native uygulama olarak kullanıma hazır kalır.
