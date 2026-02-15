# Stadyum koltuk planı

Excel dosyası `docs/stadyum durum.xlsx` ile eşleşir:

- **X** = oturulabilir koltuk
- **Boş sütun** = koridor (bölümler koridorlarla ayrılır)

## Bölümler ve koltuk sayıları

| Bölüm | Koltuk sayısı | Açıklama |
|-------|----------------|----------|
| A     | 331            | Sol kanat (tribün) |
| B     | 324            | |
| C     | 520            | Orta (en geniş) |
| D     | 348            | |
| E     | 80             | Sağ kanat (küçük blok) |

**Toplam: 1603 koltuk.**

## Koltuk kodu formatı

`BÖLÜM-SIRA-KOLTUK` örn. **A-1-15** = A bölümü, 1. sıra, 15. koltuk.

## Veritabanı

- **stadium_seats**: `id`, `seat_code` (unique), `section`, `row_number`, `seat_in_row`, `sort_order`
- **match_tickets.seat_id**: Her bilete atanmış koltuk (FK → stadium_seats)

## Excel değişirse

1. `docs/stadyum durum.xlsx` dosyasını güncelleyin.
2. `node scripts/build-stadium-seats.mjs` → `scripts/stadium-seats.json` güncellenir.
3. `node scripts/seats-to-sql.mjs` → `supabase/migrations/019_stadium_seats_seed.sql` güncellenir.
4. Yeni migration ile tabloyu sıfırdan doldurmak için: `stadium_seats` tablosunu truncate edip 019’u tekrar çalıştırın; veya yeni bir migration’da sadece yeni koltukları INSERT edin.

## Bilet entegrasyonu

- Bilet alındığında (ücretsiz veya ödeme sonrası) otomatik olarak sıradaki boş koltuk atanır.
- Admin “Bilet oluştur” ile oluşturulan biletlere de sırayla koltuk atanır.
- Bilet başarı sayfasında ve Benim Köşem’de **Koltuk: A-1-15** şeklinde gösterilir.
