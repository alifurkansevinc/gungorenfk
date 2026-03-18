# Güvenlik Kontrolleri: Durum ve Eksikler

Bu dosya, **GUVENLIK_RAPORU.md** ve **KRITIK_ONLEMLER_TEHDIT_VE_BOZULMALAR.md** dokümanlarındaki maddelerin hangilerinin yapıldığını, hangilerinin eksik kaldığını özetler.

---

## Kaynak dokümanlar

- **`docs/GUVENLIK_RAPORU.md`** – Genel güvenlik analizi (kritik / yüksek / orta / düşük öncelik)
- **`docs/KRITIK_ONLEMLER_TEHDIT_VE_BOZULMALAR.md`** – Kritik düzeltmelerde dikkat edilecek tehditler ve bozulmalar

---

## Yapılanlar (Tamamlanan)

### 1. Kritik: Mağaza fiyat manipülasyonu

**Rapordaki öneri:** Fiyatı sadece sunucuda DB’den al, istemciden gelen `price` / `total` kullanma.

**Yapılan:**
- `/api/payment/init`: Sepetteki her ürün için `store_products` tablosundan fiyat çekiliyor.
- Üye seviyesi indirimi (`getStoreDiscountForLevel`) ve ürün bazlı indirim (`getMemberProductDiscountsForUser`) sunucuda uygulanıyor; `getEffectiveProductPrice` ile nihai fiyat hesaplanıyor.
- Misafir için indirim yok; sadece `store_products.price` kullanılıyor.
- Ürün pasif / silinmiş ise sipariş reddediliyor; stok kontrolü (beden bazlı) yapılıyor.
- Toplam (`subtotal`, `shippingCost`, `total`) tamamen sunucuda hesaplanıyor; iyzico’ya bu tutar gönderiliyor.
- Sipariş kalemleri ve iyzico sepeti sunucudaki ürün adı ve fiyatla yazılıyor.

**İlgili dosyalar:** `src/app/api/payment/init/route.ts`, `src/lib/data.ts`

---

### 2. Kritik: Sipariş / makbuz yetkisiz erişim

**Rapordaki öneri:** Token veya giriş ile sahiplik doğrulama; sadece `orderNumber` ile herkese açık erişim kaldırılması.

**Yapılan:**
- **`orders.receipt_token`** eklendi (migration `054_orders_receipt_token.sql`): Her yeni siparişe UUID `receipt_token` atanıyor.
- **`/api/orders/receipt`**: Erişim sadece (1) `token` query parametresi siparişin `receipt_token`’ı ile eşleşirse veya (2) giriş yapmış kullanıcı siparişin sahibiyse (`user_id` eşleşmesi) veriliyor. Aksi halde 403.
- **`/api/orders/pickup-info`**: Aynı kural (token veya sahip); yetkisiz erişim 403.
- Ödeme başarılı callback’te yönlendirme URL’ine `token` ekleniyor; `/odeme/basarili?orderNumber=...&token=...` ile makbuz sayfası token’lı açılabiliyor.
- **`src/lib/orders.ts`**: `getReceiptByOrderNumber` artık `token` veya `userId` ile erişim kontrolü yapıyor; `canAccessOrder` ile sahiplik/token doğrulanıyor.

**İlgili dosyalar:**  
`supabase/migrations/054_orders_receipt_token.sql`,  
`src/app/api/orders/receipt/route.ts`,  
`src/app/api/orders/pickup-info/route.ts`,  
`src/app/api/payment/callback/route.ts`,  
`src/lib/orders.ts`,  
`src/app/odeme/basarili/page.tsx`

---

## Eksikler (Yapılması Gerekenler)

### Kritik

- Bu iki kritik madde (fiyat doğrulama, makbuz/token) yukarıdaki gibi tamamlandı. Ek kritik eksik yok.

---

### Yüksek öncelik

| Madde | Rapordaki özet | Eksik / Yapılacak |
|-------|----------------|-------------------|
| **Admin bypass cookie** | Secret güçlü olsun, production’da kısıtlı/kısa süreli kullanım; 2FA düşünülsün | Bypass süresi ve production kullanımı dokümante edilmeli; 2FA planlanabilir. |
| **Callback idempotency** | Aynı ödeme token’ı için ikinci işlemde güncelleme/stok düşme yapılmasın | `/api/payment/callback` içinde sipariş zaten `PAID` ise sadece success redirect dönülmeli; stok düş ve diğer güncellemeler tekrar yapılmamalı. |
| **Rate limiting** | Ödeme init, bağış init, bilet init, admin giriş, receipt/pickup-info için IP veya kullanıcı bazlı limit | Hiçbir API/route’ta rate limit yok. Upstash Redis, Vercel KV veya middleware ile sayaç eklenmeli. |

---

### Orta öncelik

| Madde | Rapordaki özet | Eksik / Yapılacak |
|-------|----------------|-------------------|
| **Güvenlik header’ları** | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, HSTS | `next.config` veya middleware’de bu header’lar eklenmeli. |
| **Bilet by-qr** | `/api/tickets/by-qr` herkese açık; token veya auth + rate limit | Endpoint giriş veya geçici token ile kısıtlanmalı; en azından rate limit uygulanmalı. |
| **Server Action admin kontrolü** | Her admin action’da açık “admin mi?” kontrolü | RLS’e ek olarak admin server action’ların başında `getAdminSupabase()` / mevcut kullanıcının admin_users’da olup olmadığı kontrolü yapılmalı. |

---

### Düşük öncelik

| Madde | Rapordaki özet | Eksik / Yapılacak |
|-------|----------------|-------------------|
| **Ortam değişkenleri** | .env commit edilmemeli; secret’lar sadece sunucuda | Mevcut kullanım uygun; dikkat edilmeye devam. |
| **Bağımlılık güvenliği** | Periyodik `npm audit` / `npm audit fix` | Periyodik çalıştırılmalı. |
| **Girdi doğrulama / XSS** | Rich text sanitize; kargo etiketi vb. escape | Rich text için DOMPurify vb. kullanımı kontrol edilmeli. |
| **Middleware / session** | Admin layout ve API’lerde admin kontrolü | Layout ve ilgili API’lerde kontrol var; yeni sayfa/API eklenirken tekrar kontrol edilmeli. |

---

## Özet tablo (güncel)

| Öncelik | Konu | Durum |
|---------|------|--------|
| Kritik | Mağaza fiyat manipülasyonu | Yapıldı (sunucuda fiyat + indirim) |
| Kritik | Sipariş/makbuz yetkisiz erişim | Yapıldı (token + sahip kontrolü) |
| Yüksek | Admin bypass güvenliği | Eksik (dokümantasyon / 2FA) |
| Yüksek | Callback idempotency | Eksik (PAID ise tekrar işlem yapılmamalı) |
| Yüksek | Rate limiting | Eksik (tüm kritik uçlar) |
| Orta | Güvenlik header’ları | Eksik |
| Orta | Bilet by-qr erişimi | Eksik |
| Orta | Server Action admin kontrolü | Kısmen (RLS var; action başında açık kontrol eksik olabilir) |
| Düşük | Env ve dependency | Sürekli dikkat |

---

Bu dosya, güvenlik kontrolleri sırasında kalan eksikleri takip etmek için güncellenebilir. Kritik maddeler tamamlandı; sırada yüksek öncelikli idempotency ve rate limiting var.
