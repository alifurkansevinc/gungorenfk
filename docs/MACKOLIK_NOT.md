# Maç skorları – Mackolik / dış kaynak

## Şu an

- Skorlar **admin panelinden manuel** giriliyor (Maçlar sayfası).
- Veritabanında `matches` tablosu: `goals_for`, `goals_against`, `match_date`, `opponent_name`, vb.

## Mackolik’ten veri çekme

- **Mackolik’in resmi bir public API’si yok.** Üçüncü taraf çözümler (PHP ile sayfa çözümleyen scriptler, vb.) var; bunlar Mackolik’in yapısı değişince bozulabilir.
- **Amatör / bölgesel ligler** genelde Mackolik’te ya hiç yoktur ya da sınırlıdır; veri varsa bile ID/lig bilgisi araştırılmalı.
- **Seçenekler:**
  1. **Manuel giriş (mevcut):** Admin panelinden maç ekleme/düzenleme. En stabil yöntem.
  2. **Mackolik scraping:** Belirli bir lig/maç sayfası için özel bir scraper (Node/Next API route) yazılabilir; yasal ve teknik riskler var, bakım gerekir.
  3. **Resmi/yarı resmi lig API’si:** TFF veya bölge ligi açık veri/API sunarsa, ona göre entegrasyon eklenir.

## Sonuç

- Şimdilik **sadece admin paneli** ile maç/skor girişi kullanılıyor.
- İleride Mackolik veya başka bir kaynak netleşirse, aynı `matches` tablosunu dolduracak bir **senkronizasyon job’ı veya API route** eklenebilir.
