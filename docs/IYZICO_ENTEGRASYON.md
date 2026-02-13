# iyzico Ödeme Entegrasyonu

Apeirona projesindeki iyzico entegrasyonu Güngören FK mağazasına uyarlandı.

## Yapılanlar

- **Supabase:** `orders` ve `order_items` tabloları (migration `008_orders_and_iyzico.sql`)
- **lib/iyzico.ts:** Checkout Form başlatma ve sonuç sorgulama (3D Secure)
- **API:** `POST /api/payment/init` (sipariş oluşturur, iyzico token + form döner), `POST /api/payment/callback` (iyzico yönlendirmesi, sipariş güncellenir)
- **Sepet:** `CartContext` (localStorage), ürün sayfasında "Sepete ekle", `/sepet`, `/odeme` (adres formu + iyzico formu), `/odeme/basarili`, `/odeme/hata`

## Kurulum

1. **Migration çalıştır:** Supabase Dashboard → SQL Editor veya `supabase db push` ile `008_orders_and_iyzico.sql` uygula.

2. **iyzico hesabı:** [iyzico](https://www.iyzico.com) üzerinden sandbox veya canlı API anahtarlarını al.

3. **.env:**
   ```env
   IYZICO_API_KEY=...
   IYZICO_SECRET_KEY=...
   # Sandbox: https://sandbox-api.iyzipay.com | Canlı: https://api.iyzipay.com
   IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
   ```

4. **Callback URL:** Ödeme sonrası iyzico kullanıcıyı `{SITE_URL}/api/payment/callback` adresine POST ile yönlendirir. `NEXT_PUBLIC_BASE_URL` veya `VERCEL_URL` doğru olmalı.

## Akış

1. Kullanıcı mağazadan ürünleri sepete ekler → `/sepet` → "Ödemeye geç" → `/odeme`
2. Adres bilgilerini doldurur → "iyzico ile ödemeye geç" → `POST /api/payment/init` → sipariş oluşturulur, iyzico Checkout Form HTML döner
3. Sayfada iyzico formu (kart bilgileri) gösterilir → kullanıcı öder → iyzico 3D Secure sonrası `POST /api/payment/callback?token=...` yapar
4. Callback token ile iyzico’dan sonucu alır, siparişi PAID/FAILED günceller, `/odeme/basarili` veya `/odeme/hata` yönlendirir.

## Admin

Siparişleri görmek için ileride admin panele "Siparişler" sayfası eklenebilir; veriler `orders` ve `order_items` tablolarında.
