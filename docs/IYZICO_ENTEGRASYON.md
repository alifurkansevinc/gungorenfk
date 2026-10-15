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
Ödeme sonrası iyzico, müşterinin tarayıcısını `{SITE}/api/payment/callback` adresine POST ile yönlendirir.  
Adres, ödemenin başladığı sitenin host’undan üretilir (`https://www.siteniz.com` gibi). Böylece eski bir `NEXT_PUBLIC_BASE_URL` ödemeyi başka domaine yollayıp siparişi **Bekliyor** bırakmaz.

Yine de kanonik adresi tanımlayın:

```env
NEXT_PUBLIC_SITE_URL=https://www.siteniz.com
```

### 4b. Webhook (ödeme alındı, sipariş bekliyor)
Tarayıcı 3D Secure sonrası kapanırsa callback hiç gelmez; para çekilmiş olur, sipariş `PENDING` kalır. Bunu iyzico’nun sunucudan sunucuya bildirimi kapatır.

iyzico panel → **Ayarlar → Firma Ayarları → İşyeri Bildirimleri**:

```text
https://www.siteniz.com/api/iyzico/webhook
```

İmza doğrulaması `X-IYZ-SIGNATURE-V3` ile yapılır. Bildirimdeki token, iyzico’dan tekrar sorgulanır; yalnızca `paymentStatus = SUCCESS` olan sipariş, bağış veya bilet **Ödendi** yapılır. Aynı bildirim iki kez gelirse stok ve taraftar harcaması bir kez işlenir.

Admin siparişler sayfası açıldığında bekleyen iyzico siparişleri de yeniden sorgulanır. Ödemesi alınmış olanlar, 36 saat dolup silinmeden önce **Ödendi** durumuna çekilir.

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

4. **Callback URL:** Ödeme sonrası tarayıcı `{SITE}/api/payment/callback` adresine döner. Adres, ödemenin açıldığı host’tan üretilir.
5. **Webhook:** iyzico panelde İşyeri Bildirimleri URL’si `{SITE}/api/iyzico/webhook` olmalı. Callback kaçsa bile ödenen kayıt burada kapanır.

## Akış

1. Kullanıcı mağazadan ürünleri sepete ekler → `/sepet` → "Ödemeye geç" → `/odeme`
2. Adres bilgilerini doldurur → "iyzico ile ödemeye geç" → `POST /api/payment/init` → sipariş oluşturulur, iyzico Checkout Form HTML döner
3. Sayfada iyzico formu gösterilir → kullanıcı öder → tarayıcı `POST /api/payment/callback` yapar. Token, form gövdesinden veya adres çubuğundan okunur.
4. Callback, token ile iyzico sonucunu sorgular. `SUCCESS` ise sipariş bir kez **Ödendi** yapılır (stok ve taraftar harcaması da bir kez). Sorgu hatasında sipariş bekliyor kalır; iptal edilmez.
5. Tarayıcı kapanırsa iyzico aynı sonucu `POST /api/iyzico/webhook` ile bildirir. Admin siparişler sayfası da bekleyen kayıtları yeniden sorgular.

## Admin

Siparişleri görmek için ileride admin panele "Siparişler" sayfası eklenebilir; veriler `orders` ve `order_items` tablolarında.
