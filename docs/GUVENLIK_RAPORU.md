# Güngören FK Site Güvenlik Analizi Raporu

Bu rapor, sitedeki olası güvenlik zaaflarını ve alınması gereken önlemleri özetler.

---

## Kritik (Acil Önlem)

### 1. Ödeme / Fiyat Manipülasyonu (Mağaza)

**Durum:** `/api/payment/init` isteğinde sepetteki ürünlerin **fiyatı ve içeriği istemciden (client) geliyor**; sunucu bu fiyatları veritabanından doğrulamıyor.

**Risk:** Saldırgan, sepetteki ürünlerin fiyatını düşük gönderip (örn. 0,01 ₺) iyzico’da da o tutarla ödeme başlatabilir. Ödeme başarılı olursa sipariş o tutarla kaydedilir.

**Yapılması gereken:**
- Sipariş oluşturmadan önce her `productId` için `store_products` tablosundan **gerçek fiyatı** çekin.
- İndirim varsa (üye / ürün bazlı) sadece sunucu tarafında hesaplayın.
- İstemciden gelen `price` ve `total` değerlerini **hiç kullanmayın**; toplamı tamamen sunucuda hesaplayıp iyzico’ya o tutarı gönderin.

---

### 2. Sipariş / Makbuz Bilgisine Yetkisiz Erişim

**Durum:** `/api/orders/receipt` ve `/api/orders/pickup-info` uçları **kimlik doğrulama istemiyor**. Sadece `orderNumber` (örn. `GFK2603115889`) query parametresi ile istek atılıyor.

**Risk:** Sipariş numarası tahmin edilebilir (GFK + yıl/ay/gün + 4 rakam). Deneme-yanılma veya sıralı denemelerle başka müşterilerin adresi, iletişim bilgisi ve sipariş içeriği görülebilir.

**Yapılması gereken:**
- En azından **geçici token** (örn. tek kullanımlık, 24 saat geçerli) ile makbuz sayfasına erişim verin; token ödeme başarılı sayfasına URL’de eklenebilir.
- Veya kullanıcı giriş yapmışsa `user_id` / `guest_email` ile siparişin sahibi olduğunu doğrulayın; giriş yoksa sadece token ile erişime izin verin.

---

## Yüksek Öncelik

### 3. Admin Bypass Cookie

**Durum:** `ADMIN_BYPASS_SECRET` ile 7 gün süreli bir cookie set ediliyor; bu cookie ile tüm admin işlemleri yapılabiliyor.

**Risk:** Secret zayıfsa veya sızdıysa, herhangi biri admin paneline tam erişim kazanır. Cookie çalınsa (XSS, reklam scripti vb.) aynı risk oluşur.

**Yapılması gereken:**
- Bypass’ı sadece **geliştirme / acil bakım** için kullanın; production’da mümkünse kapatın veya çok kısa süreli (örn. 1 saat) yapın.
- Secret’ı güçlü ve rastgele tutun (örn. 32+ karakter), periyodik rotate edin.
- Admin panelinde ek olarak **2FA** (TOTP) düşünün.

### 4. Ödeme / Bilet / Bağış Callback’lerinde Çift İşlem (Idempotency)

**Durum:** iyzico aynı ödeme için callback’i birden fazla kez (GET ve POST) gönderebiliyor. Callback’lerde **idempotency** (aynı token için ikinci işlemde güncelleme yapmama) net değil.

**Risk:** Ağ gecikmesi veya kullanıcı yenilemesiyle aynı ödeme iki kez işlenebilir; stok iki kez düşebilir veya bilet iki kez verilebilir.

**Yapılması gereken:**
- Callback’te sipariş/bağış/bilet zaten `PAID` / tamamlanmış ise **sadece success redirect** dönün, tekrar `update` / `insert` yapmayın.
- Mümkünse `payment_id` veya iyzico token’ı ile “bu token zaten işlendi” kontrolü ekleyin.

### 5. Rate Limiting Eksikliği

**Durum:** API route’larda ve form gönderimlerinde **rate limit** yok.

**Risk:**
- `/api/payment/init`, `/api/donation/init`, bilet init: **brute force** veya **kötüye kullanım** (çok sayıda sipariş/bağış denemesi).
- `/admin/giris`, bypass formu: **şifre / bypass kodu denemeleri**.
- `/api/orders/receipt?orderNumber=...`: **sipariş numarası tarama**.

**Yapılması gereken:**
- Kritik uçlarda IP veya kullanıcı bazlı rate limit (örn. Upstash Redis, Vercel KV veya middleware ile basit sayacı) ekleyin.
- Özellikle: ödeme init, bağış init, bilet init, admin giriş, receipt/pickup-info.

---

## Orta Öncelik

### 6. Hassas Veri Sızıntısı (Header / Hata Mesajları)

**Durum:** Standart güvenlik başlıkları (CSP, X-Frame-Options, HSTS vb.) ve hata sayfalarında detay kontrolü yapılmadı.

**Yapılması gereken:**
- `next.config` veya middleware ile örneğin şunları ekleyin:
  - `X-Frame-Options: DENY` (veya SAMEORIGIN)
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - HTTPS zorunluysa `Strict-Transport-Security`
- Production’da kullanıcıya dönen hatalarda **stack trace veya iç detay göstermeyin**.

### 7. Bilet QR ile Bilgi Sızıntısı

**Durum:** `/api/tickets/by-qr?qrCode=...` herkese açık. QR kodu bilen herkes koltuk bilgisini alabiliyor.

**Risk:** QR kodu tahmin edilemez olmalı (UUID vb.); yine de endpoint’in herkese açık olması bilgi ifşası riski taşır.

**Yapılması gereken:** Mümkünse bu endpoint’i sadece giriş yapmış kullanıcıya veya geçici token ile sınırlayın; en azından rate limit uygulayın.

### 8. Server Action Yetki Kontrolü

**Durum:** Admin işlemleri (ürün ekleme, maç güncelleme vb.) Server Action ile yapılıyor. Yetki, büyük ölçüde **RLS** ve sadece admin sayfalarından çağrılmasına dayanıyor; action içinde açık “admin mi?” kontrolü yok.

**Risk:** İleride bir sayfada yanlışlıkla bu action’lar çağrılırsa veya RLS’te açık kalırsa yetkisiz işlem yapılabilir.

**Yapılması gereken:** Her admin Server Action’ın başında `getAdminSupabase()` veya benzeri kullanıyorsanız, önce “mevcut kullanıcı admin mi?” kontrolü yapın; değilse hemen hata dönün. RLS’i tek dayanak olarak bırakmayın.

---

## Düşük Öncelik / İyileştirme

### 9. Ortam Değişkenleri

- **.env** ve **.env.example** production’da asla commit edilmemeli; `.env.local` kullanın.
- `ADMIN_BYPASS_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `IYZICO_SECRET_KEY` vb. yalnızca sunucu tarafında ve güvenli yerde tutulmalı (Vercel env, hiç client’a gönderilmemeli). Mevcut kullanım doğru görünüyor; buna dikkat edilmeye devam edilmeli.

### 10. Bağımlılık Güvenliği

- Periyodik `npm audit` ve `npm audit fix` çalıştırın.
- Kritik güncellemeleri takip edin (Next.js, Supabase, iyzico SDK).

### 11. Girdi Doğrulama ve XSS

- Kullanıcıdan gelen metinler (ad, adres, mesaj vb.) veritabanına yazılırken **escape** ediliyor; React varsayılan olarak XSS’e karşı koruma sağlar.
- HTML içeriği (örn. haber body) rich text ise **sanitize** (DOMPurify vb.) kullanın.
- Kargo etiketi gibi HTML üreten yerlerde `escapeHtml` kullanımı doğru; benzer yerlerde de aynı disiplin sürdürülmeli.

### 12. Middleware ve Session

- Supabase `updateSession` ile session yenileniyor; admin paneli layout’ta giriş ve admin kontrolü var. Bu yapı korunmalı.
- Admin sayfalarının tamamının bu layout altında olduğundan ve API route’ların da `getUser()` / `admin_users` kontrolü yaptığından emin olun.

---

## Özet Tablo

| Öncelik   | Konu                         | Özet önlem                                      |
|----------|------------------------------|--------------------------------------------------|
| Kritik   | Mağaza fiyat manipülasyonu   | Fiyatı sadece sunucuda DB’den al, client’a güvenme |
| Kritik   | Sipariş/makbuz yetkisiz erişim | Token veya giriş ile sahiplik doğrulama          |
| Yüksek   | Admin bypass güvenliği       | Güçlü secret, kısa süre, production’da kısıtlı kullanım |
| Yüksek   | Callback idempotency         | Aynı token/ödeme için tek işlem                  |
| Yüksek   | Rate limiting                | Ödeme, bağış, bilet, admin giriş, receipt       |
| Orta     | Güvenlik header’ları         | X-Frame-Options, CSP, HSTS vb.                   |
| Orta     | Bilet by-qr erişimi          | Token veya auth + rate limit                     |
| Orta     | Server Action admin kontrolü | Her admin action’da açık admin kontrolü          |
| Düşük    | Env ve dependency            | Audit, env sızıntısı olmaması                    |

---

Bu rapor, mevcut kod incelemesine dayanmaktadır. Penetrasyon testi veya kapsamlı güvenlik denetimi için profesyonel bir güvenlik firması ile çalışmanız önerilir.
