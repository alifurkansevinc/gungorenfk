# iyzico Ödeme Entegrasyonu

Güngören FK mağaza, bilet ve bağış ödemeleri iyzico Checkout Form ile yapılıyor.

## iyzico'yu Nasıl Bağlarız?

### 1. iyzico hesabı
- [iyzico.com](https://www.iyzico.com) üzerinden kayıt olun / giriş yapın.
- **Sandbox (test):** Panelden sandbox API anahtarlarını alın.
- **Canlı:** Mağaza/uygulama bilgilerinizi girip onay sonrası canlı API anahtarlarını alın.

### 2. API anahtarlarını alın
- iyzico Panel → **Ayarlar** / **Entegrasyon** (veya API Anahtarları).
- **API Key** ve **Secret Key** değerlerini kopyalayın (sandbox veya canlı).

### 3. Ortam değişkenleri (.env)
Proje kökünde `.env` veya `.env.local`:

```env
IYZICO_API_KEY=sandbox-veya-canli-api-key
IYZICO_SECRET_KEY=sandbox-veya-canli-secret-key
# Test: https://sandbox-api.iyzipay.com  |  Canlı: https://api.iyzipay.com
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
```

Vercel kullanıyorsanız: **Project → Settings → Environment Variables** içine aynı üç değişkeni ekleyin.

### 4. Callback URL
Ödeme sonrası iyzico kullanıcıyı şu adrese yönlendirir: `{SITE_URL}/api/payment/callback`.  
Kod bu adresi otomatik üretir: `NEXT_PUBLIC_BASE_URL` veya (Vercel’de) `https://${VERCEL_URL}`.  
Canlı sitede doğru çalışması için:

```env
NEXT_PUBLIC_BASE_URL=https://siteniz.com
```

iyzico panelde ayrıca callback URL girmeniz gerekmez; istek içinde gönderiliyor.

### 5. Veritabanı
Supabase’de `008_orders_and_iyzico.sql` migration’ı uygulanmış olmalı. Uygulanmadıysa SQL Editor’den çalıştırın.

### 6. Test (sandbox)
- Sandbox anahtarları ve `IYZICO_BASE_URL=https://sandbox-api.iyzipay.com` ile
- Mağazadan sepete ekleyip `/odeme` → adres → "iyzico ile ödemeye geç"
- iyzico dokümanındaki test kartlarıyla deneyin

### 7. Canlıya geçiş
- iyzico’dan canlı **API Key** ve **Secret Key** alın.
- `.env` / Vercel’de bu değerleri yazın ve `IYZICO_BASE_URL=https://api.iyzipay.com` yapın.
- Projeyi yeniden deploy edin.

---

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
