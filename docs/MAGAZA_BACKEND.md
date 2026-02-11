# Mağaza backend

Mağaza sayfası demo ürünlerle dolu görünür; **gerçek ürünler ve fiyatlar backend (admin panel) üzerinden yönetilir.**

## Veri kaynağı

- **Supabase:** `store_products` tablosu (id, name, slug, description, price, image_url, sort_order, is_active).
- **Demo ürünler:** Veritabanında ürün yokken veya bir slug DB’de bulunamazsa `src/lib/demo-products.ts` içindeki liste kullanılır. Bu liste sadece tasarım ve test içindir; canlıda admin’den eklenen ürünler geçerlidir.

## Admin panel

- **Giriş:** `/admin/giris` → Admin kullanıcı ile giriş.
- **Mağaza:** `/admin/magaza` → Ürün listesi, yeni ürün, düzenle, sil.
- **Alanlar:** Ad, slug (URL için benzersiz), açıklama, fiyat, görsel URL. Sipariş/ödeme sitede yok; fiyat bilgi amaçlı.

## Backend’de yapılacaklar (önemli)

1. **Ürün CRUD:** Admin’den eklenen/düzenlenen ürünler `store_products`’a yazılır; mağaza listesi ve ürün detay sayfası bu veriyi kullanır.
2. **Görsel:** Şu an sadece `image_url` (harici link). İleride Supabase Storage ile dosya yükleme eklenebilir.
3. **Kategoriler:** İstenirse `store_products`’a kategori alanı eklenip filtreleme yapılabilir.
4. **Sipariş / stok:** Planlanan değil; sipariş kulüp ile iletişimle. İleride sipariş tablosu ve stok alanları eklenebilir.

Özet: Mağaza front’u hazır; **tek gerçek kaynak backend (Supabase + admin panel)**. Demo ürünler sadece veri yokken görünür.
