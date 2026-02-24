# Rozet kademeleri ve Minimum Puan

## Minimum Puan (min_points) nasıl çalışır?

- **fan_levels** tablosundaki her kademe için bir **min_points** değeri tanımlanır (Admin → Rozet Kuralları → Düzenle).
- **Şu anki davranış:** Seviye atlama **minimum puana bakılmadan** yapılır. Yani bir taraftarın kademesi, sadece **üç barem** (mağaza harcaması, maç bileti sayısı, bağış tutarı) hedeflerine ulaşınca bir üst kademeye geçer (`lib/fan-level.ts` → `checkAndLevelUp`).
- **min_points** şu an **bilgi / raporlama** veya ileride kullanılmak üzere tutulur. İleride birleşik bir “puan” sistemi (ör. mağaza + bilet + bağıştan puan) getirilirse, “bu kademede olmak için en az X puan” kuralı **min_points** ile uygulanabilir.
- **fan_profiles.points:** Taraftar profilinde bir **points** alanı vardır; şu an seviye atlama mantığında kullanılmıyor. İleride puan biriktirilip **min_points** ile kıyaslanabilir.

## Mevcut seviye atlama mantığı

1. Taraftarın **mevcut kademesi** `fan_profiles.fan_level_id` ile belirlenir.
2. **Bir üst kademe** için `fan_levels` içinde **target_store_spend**, **target_tickets**, **target_donation** hedefleri tanımlıdır.
3. Üç hedefin **hepsi** karşılandığında (`store_spend_total`, farklı maç sayısı, `donation_total`) taraftar bir üst kademeye geçer; baremler sıfırlanır.
4. En az iki barem türü hedefli olmalıdır; tek hedefle seviye atlama yapılmaz.

## Benim Köşem’de avantajlar

- **Mevcut rütbenin avantajları:** Admin’de ilgili kademenin **Avantajlar** alanına yazılan maddeler (her satır bir madde) hem rozet kartında hem sağ sütunda “Mevcut rütbenin avantajları” olarak gösterilir.
- **Sonraki rütbenin avantajları:** Bir sonraki kademe için admin’de tanımlı avantajlar, “Sonraki rozetin için” bölümünde “Sonraki rütbenin avantajları” başlığıyla madde madde listelenir.
- Admin’de bu metinler **Rozet Kuralları → [Kademe] → Düzenle** içindeki **“Bu rütbenin avantajları”** alanından yönetilir.
