-- Rozet isimleri (1 düşük -> 5 yüksek): As Oyuncu, Maestro, Kapitano, General, Efsane
-- Açıklamalar rozet altında; sonraki rozet için 3 barem (mağaza, bilet, bağış) backend ile ayarlanacak

-- fan_levels: açıklama ve hedef alanları (sonraki kademe için gerekenler backend’den ayarlanır)
ALTER TABLE fan_levels ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE fan_levels ADD COLUMN IF NOT EXISTS target_store_spend decimal(12,2);
ALTER TABLE fan_levels ADD COLUMN IF NOT EXISTS target_tickets int;
ALTER TABLE fan_levels ADD COLUMN IF NOT EXISTS target_donation decimal(12,2);

-- Güncelle: id 1-5 aynı kalır, isim/slug/description değişir
UPDATE fan_levels SET name = 'As Oyuncu', slug = 'as-oyuncu', sort_order = 1,
  description = 'Bu rozet aramıza yeni katıldığını ama gereken kanın sende olduğunu gösteriyor. Bundan sonraki rozeti kazanırsan "Maestro" olacaksın.'
WHERE id = 1;

UPDATE fan_levels SET name = 'Maestro', slug = 'maestro', sort_order = 2,
  description = 'Bu rozeti aldıysan maçların vazgeçilmezi olduğunu da gösteriyorsun. Bundan sonraki rozeti kazanırsan "Kapitano" olacaksın.'
WHERE id = 2;

UPDATE fan_levels SET name = 'Kapitano', slug = 'kapitano', sort_order = 3,
  description = 'Sen olmazsan biz yokuz; o kadar önemli işler çıkartıyorsun ve sana minnettarız. Artık koltuk numaran belli, %25 indirimin var mağazamızda. Bundan sonraki rozeti kazanırsan "General" olacaksın.'
WHERE id = 3;

UPDATE fan_levels SET name = 'General', slug = 'general', sort_order = 4,
  description = 'Takımın resmi kongre üyesi olmaya hak kazandın. Koltuk numaran zaten vardı; mağaza indirimin artık %30. Bundan sonra son rozetini alabilirsin: Efsane.'
WHERE id = 4;

UPDATE fan_levels SET name = 'Efsane', slug = 'efsane', sort_order = 5,
  description = 'Takımın vücut bulmuş hali olduğunu gösteren bir rozetin var artık. Her sene 2 sezon forman isminle hazır olacak. Her sene seçeceğin 5 maçta protokol biletin olacak. %35 mağaza indirimin tanımlandı. Her sene başı 10 takım rozeti senin olacak. Atkın, şapkan ve yağmurluğun da çantasıyla birlikte senin olmayı bekliyor. İyi ki varsın.'
WHERE id = 5;

-- Taraftar 3 barem: mağaza harcaması, maç biletleri sayısı, bağış toplamı (kurallar backend’den)
ALTER TABLE fan_profiles ADD COLUMN IF NOT EXISTS store_spend_total decimal(12,2) NOT NULL DEFAULT 0;
ALTER TABLE fan_profiles ADD COLUMN IF NOT EXISTS match_tickets_count int NOT NULL DEFAULT 0;
ALTER TABLE fan_profiles ADD COLUMN IF NOT EXISTS donation_total decimal(12,2) NOT NULL DEFAULT 0;
