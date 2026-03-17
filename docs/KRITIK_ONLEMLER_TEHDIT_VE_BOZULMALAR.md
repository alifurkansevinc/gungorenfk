# Kritik Öncelikli Düzeltmeler: Önümüze Çıkacak Tehditler ve Bozulmalar

Kritik güvenlik önlemlerini uygularken **site mevcut halinde** karşılaşılabilecek aksilikler, tehditler ve kullanıcı deneyimini bozabilecek durumlar aşağıda listelenmiştir. Bu liste, düzeltmeleri yaparken dikkat edilmesi gereken noktaları özetler.

---

## 1. KRİTİK: Mağaza Fiyat Doğrulama (Sunucuda fiyat hesaplama)

### Ne değişecek?
- `/api/payment/init` artık sepetteki ürünlerin fiyatını **istemciden almayacak**; her `productId` için veritabanından fiyat çekilecek, üye/ürün indirimi sunucuda uygulanacak; toplam sadece sunucuda hesaplanacak.

### Önümüze çıkabilecek tehditler ve bozulmalar

| Tehdit / Risk | Açıklama | Önlem |
|---------------|----------|--------|
| **İndirim uyumsuzluğu** | Sepette kullanıcı indirimli fiyat görüyor (ör. 90 ₺). Sunucuda `getStoreDiscountForLevel` veya `getMemberProductDiscountsForUser` mantığı **aynı şekilde** uygulanmazsa iyzico’da farklı tutar (örn. 100 ₺) çıkar. Kullanıcı “fiyat değişti” diye ödemeyi iptal edebilir veya güven kaybı oluşur. | Sunucuda indirim hesaplamasını frontend ile birebir aynı yap: `getEffectiveProductPrice(listPrice, discountPercent)`. Üye için `fan_level_id` → `getStoreDiscountForLevel`, `getMemberProductDiscountsForUser` ile ürün bazlı indirim; ikisinden büyük olanı uygula. |
| **Misafir (guest) kullanıcı** | Giriş yoksa `userId` yok; sunucuda üye indirimi 0 olmalı. Mevcut akışta zaten misafir tam fiyat ödüyor. Yanlışlıkla sunucuda misafire indirim uygulanırsa gelir kaybı; indirim uygulanmazsa bozulma olmaz. | Misafir için `levelDiscount = 0`, `memberDiscounts = {}` kullan; sadece `store_products.price` ile hesapla. |
| **Ürün artık yok / pasif** | Sepetteki bir ürün admin tarafından silindi veya `is_active = false` yapıldı. Sunucu siparişi reddedip “Ürün artık mevcut değil” dönebilir. | Kullanıcıya net mesaj: “Sepetinizdeki bazı ürünler artık mevcut değil. Lütfen sepeti güncelleyip tekrar deneyin.” Ödeme başlamadan önce tüm productId’leri `store_products` (is_active) ile doğrula. |
| **Fiyat değişimi (admin güncelledi)** | Kullanıcı sepete ürünü 100 ₺ iken ekledi; ödeme adımında admin fiyatı 120 ₺ yaptı. Sunucu 120 ₺ ile ödeme başlatır. Kullanıcı ekranda 100 ₺ bekleyebilir. | İsterseniz “Bir veya daha fazla ürünün fiyatı güncellendi. Toplam: X ₺. Devam etmek ister misiniz?” gibi onay metni veya en azından ödeme sayfasında sunucudan dönen toplamı gösterin; böylece fark kullanıcıda şok yaratmaz. |
| **Stok yetersiz** | Sunucuda stok kontrolü eklerseniz, ödeme anında beden bazlı stok 0 ise sipariş reddedilir. Kullanıcı “Sepette vardı, ödemede hata aldım” yaşayabilir. | Hata mesajı: “Ürün stokta kalmadı. Lütfen sepeti güncelleyin.” Race condition (iki kullanıcı aynı son ürünü alırsa biri reddedilir) kabul edilebilir; kritik olan tutarlı mesaj ve akış. |
| **Sipariş kalemleri / iyzico içeriği** | Sipariş kaydı ve iyzico sepetinde ürün adı, fiyat kullanılıyor. Fiyatı sunucudan alınca **ürün adını da** veritabanından (güncel `name`) almak daha tutarlı olur. İstemciden sadece `productId`, `quantity`, `size` kullanılabilir. | `order_items` ve iyzico basket’e sunucuda hesaplanan fiyat ve `store_products.name` yazın; böylece makbuz ve ödeme özeti doğru görünür. |

### Mevcut sitede bozulma riski
- **En büyük risk:** İndirim mantığının sunucuda eksik veya farklı olması → kullanıcı farklı tutar görür, ödeme iptal veya şikayet.
- **İkinci risk:** Ürün pasif/silinmiş kontrolü eklenince, nadir de olsa “ürün artık mevcut değil” ile sipariş reddi; kullanıcı sepeti güncellemek zorunda kalır. Bu davranış bilinçli tercihtir, “bozulma” değil.

---

## 2. KRİTİK: Sipariş / Makbuz Erişim Güvenliği (Token veya sahiplik kontrolü)

### Ne değişecek?
- `/api/orders/receipt` ve `/api/orders/pickup-info` artık sadece `orderNumber` ile erişime izin vermeyecek; ya **geçici token** ya da **giriş yapmış kullanıcının siparişe sahip olması** kontrol edilecek.
- Ödeme başarılı yönlendirmesine token eklenebilir; makbuz sayfası bu token’ı kullanacak.

### Önümüze çıkabilecek tehditler ve bozulmalar

| Tehdit / Risk | Açıklama | Önlem |
|---------------|----------|--------|
| **Eski linkler çalışmaz** | Bugün e-posta veya kullanıcının kaydettiği link `.../odeme/basarili?orderNumber=GFK...` şeklinde. Token zorunlu kılınıp bu linklere token eklenmezse, **mevcut tüm linkler** makbuz açılamaz hale gelir. | Geriye dönük uyum: (1) Giriş yapmış kullanıcı için `user_id` veya `guest_email` ile siparişin sahibi olduğunu doğrula; sahipse sadece `orderNumber` yeterli. (2) Giriş yoksa veya misafir siparişiyse **token** zorunlu olsun. Böylece eski “sadece orderNumber” linkleri sadece sipariş sahibi giriş yapmışsa çalışır. |
| **Misafir kullanıcı makbuzu** | Misafir ödeme sonrası sayfada makbuzu görüyor; sayfayı kapatıp 1 saat sonra aynı linki açarsa token URL’de yoksa (örn. token sadece redirect’te bir kez verildiyse ve kullanıcı linki kopyalamadıysa) tekrar makbuz açılamaz. | Ödeme başarılı sayfasında “Bu sayfayı yer imlerine ekleyin” veya “Makbuz linkiniz: …” ile token’lı linki gösterin. İleride sipariş onay e-postası gelirse, e-postadaki link token’lı olmalı (callback’te token üretilip saklanır, e-postada kullanılır). |
| **Token üretim ve doğrulama** | Callback’te token üretilmezse veya başarı sayfası token’ı receipt API’ye göndermezse makbuz hiç yüklenmez; kullanıcı beyaz ekran veya “Yetkisiz” görür. | Callback’te ödeme başarılı olduktan sonra kısa ömürlü token (örn. JWT: orderNumber + expiry 24h) üret; redirect URL’e ekle. Başarı sayfası ve receipt API token’ı okuyup doğrulasın. Test: misafir ödeme → başarı sayfası → makbuz görünüyor mu, sayfa yenilenince token’lı URL ile hâlâ açılıyor mu? |
| **E-posta bildirimi** | Sipariş onay e-postası gönderiyorsanız, e-postadaki “Siparişinizi görüntüle” linki şu an muhtemelen `orderNumber` ile. Token zorunlu olunca bu link **token içermeli**; yoksa tıklayan makbuzu açamaz. | E-posta şablonunda link: `BASE_URL/odeme/basarili?orderNumber=XXX&token=YYY`. Token’ı callback’te veya sipariş PAID olduktan hemen sonra üretip saklayın (örn. `receipt_tokens` tablosu veya JWT imzalı, saklama gerekmez). |
| **getReceiptByOrderNumber kullanımı** | Şu an `odeme/basarili` sayfası sunucuda `getReceiptByOrderNumber(orderNumber)` çağırıyor; bu fonksiyon **sahiplik kontrolü yapmıyor**. Token/sahiplık kontrolü eklendiğinde bu çağrı ya token ile ya da session ile korunmalı. | Seçenek A: Sayfa sadece `orderNumber` + `token` ile açılsın; sunucu token’ı doğrular, doğruysa `getReceiptByOrderNumber` çağrılır. Seçenek B: Giriş varsa siparişin bu kullanıcıya ait olduğunu kontrol eden bir wrapper (örn. `getReceiptForUser(orderNumber, userId)`) kullanın; yoksa token gerekli. |

### Mevcut sitede bozulma riski
- **En büyük risk:** Token veya sahiplik kontrolü getirilirken eski linklerin tamamen kırılması (e-posta, bookmark). Bu yüzden **giriş yapmış sahip için sadece orderNumber yeterli** bırakmak önemli.
- **İkinci risk:** Token’ın redirect URL’e eklenmemesi veya başarı sayfasında kullanılmaması → ödeme sonrası makbuzun hiç görünmemesi (kullanıcı deneyimi ciddi bozulma).

---

## Özet: Kritik düzeltmelerde dikkat edilecekler

1. **Fiyat doğrulama**  
   - Sunucuda fiyat ve indirim mantığını frontend ile **birebir** aynı yapın (özellikle üye + ürün bazlı indirim).  
   - Ürün pasif/silinmiş veya stok yoksa net hata mesajı verin; kullanıcıyı sepeti güncellemeye yönlendirin.

2. **Makbuz erişimi**  
   - Eski davranışı tamamen kaldırmayın: **giriş yapmış kullanıcı** için sipariş sahibiyse sadece `orderNumber` ile erişim kalsın.  
   - Misafir için token zorunlu olsun; token’ı ödeme sonrası URL’de verin ve mümkünse kullanıcıya “linki saklayın” bilgisini gösterin.  
   - E-posta ile link gönderiyorsanız, bu linke token ekleyin.

Bu adımlara uyulduğunda kritik güvenlik iyileştirmeleri yapılırken mevcut kullanıcı deneyimi mümkün olduğunca korunmuş olur.
