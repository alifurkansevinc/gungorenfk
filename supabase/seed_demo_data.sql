-- Demo veriler: Tasarımı ayağa kaldırmak için. Şemayı çalıştırdıktan sonra bu dosyayı Supabase SQL Editor'de çalıştırın.
-- fan_profiles eklenmez (auth.users'a bağlı); Anadolu Temsilcisi barı kod tarafında demo sayılarla dolar.

-- Mevcut demo verileri temizle (tekrar çalıştırırsanız)
DELETE FROM gallery_photos;
DELETE FROM galleries;
DELETE FROM news;
DELETE FROM squad;
DELETE FROM matches;
DELETE FROM store_products;

-- Maçlar
INSERT INTO matches (opponent_name, home_away, venue, match_date, competition, season, goals_for, goals_against, status) VALUES
('Kartal Belediyespor', 'home', 'Güngören Stadyumu', '2025-02-15', 'Bölgesel Amatör Lig', '2024-25', 2, 1, 'finished'),
('Sultanbeyli Belediyespor', 'away', 'Sultanbeyli Stadyumu', '2025-02-08', 'Bölgesel Amatör Lig', '2024-25', 1, 1, 'finished'),
('Esenler Erokspor', 'home', 'Güngören Stadyumu', '2025-02-01', 'Bölgesel Amatör Lig', '2024-25', 3, 0, 'finished'),
('Bayrampaşa FK', 'away', 'Bayrampaşa Stadyumu', '2025-01-25', 'Bölgesel Amatör Lig', '2024-25', 0, 2, 'finished'),
('Bağcılar Spor', 'home', 'Güngören Stadyumu', '2025-01-18', 'Bölgesel Amatör Lig', '2024-25', 1, 0, 'finished'),
('Gaziosmanpaşa FK', 'away', 'Gaziosmanpaşa Stadyumu', '2025-03-01', 'Bölgesel Amatör Lig', '2024-25', NULL, NULL, 'scheduled'),
('Zeytinburnu Spor', 'home', 'Güngören Stadyumu', '2025-03-08', 'Bölgesel Amatör Lig', '2024-25', NULL, NULL, 'scheduled');

-- Kadro
INSERT INTO squad (name, shirt_number, position, bio, sort_order, is_active) VALUES
('Ahmet Yılmaz', 1, 'Kaleci', 'Deneyimli kaleci.', 1, true),
('Mehmet Kaya', 2, 'Sağ Bek', NULL, 2, true),
('Ali Demir', 3, 'Stoper', NULL, 3, true),
('Can Özkan', 4, 'Stoper', NULL, 4, true),
('Emre Çelik', 5, 'Sol Bek', NULL, 5, true),
('Burak Arslan', 6, 'Ön Libero', NULL, 6, true),
('Serkan Aydın', 7, 'Sağ Kanat', NULL, 7, true),
('Oğuzhan Koç', 8, 'Orta Saha', 'Kaptan.', 8, true),
('Fatih Şahin', 9, 'Forvet', NULL, 9, true),
('Hakan Polat', 10, 'Orta Saha', NULL, 10, true),
('Yusuf Acar', 11, 'Sol Kanat', NULL, 11, true),
('Murat Yıldız', 12, 'Kaleci', NULL, 12, true),
('Kerem Öztürk', 14, 'Orta Saha', NULL, 14, true),
('Barış Kılıç', 17, 'Forvet', NULL, 17, true);

-- Haberler (image_url: tasarım için placeholder)
INSERT INTO news (title, slug, excerpt, body, image_url, category, published_at) VALUES
('Ligde kritik galibiyet', 'ligde-kritik-galibiyet', 'Esenler Erokspor karşılaşmasında 3-0 galip geldik.', '<p>Güngören FK, Bölgesel Amatör Lig''de Esenler Erokspor''u 3-0 mağlup etti. Maçın yıldızı iki gol atan Fatih Şahin oldu.</p>', 'https://placehold.co/800x450/8B1538/FFFFFF?text=Maç+Özeti', 'Maç', now() - interval '2 days'),
('Yeni sezon hazırlıkları başladı', 'yeni-sezon-hazirlikları', 'Takımımız 2024-25 sezonu için antrenmanlara başladı.', '<p>Güngören FK, yeni sezon öncesi çalışmalarına hız verdi. Teknik ekip ve oyuncular hedeflerini paylaştı.</p>', 'https://placehold.co/800x450/0A0A0A/FFFFFF?text=Antrenman', 'Kulüp', now() - interval '5 days'),
('Taraftarımıza teşekkür', 'taraftarimiza-tesekkur', 'Tribünlerimiz her maçta yanımızda.', '<p>1000 Taraftar 1 Bayrak kampanyasına katılan tüm taraftarlarımıza teşekkür ederiz.</p>', 'https://placehold.co/800x450/8B1538/FFFFFF?text=Taraftar', 'Duyuru', now() - interval '8 days'),
('Kış transferi: Takım güçlendirildi', 'kis-transferi', 'Orta saha ve forvet hattına yeni isimler eklendi.', '<p>Transfer döneminde iki yeni oyuncu kadromuza katıldı. Başarılar dileriz.</p>', NULL, 'Transfer', now() - interval '12 days'),
('İlk yarı değerlendirmesi', 'ilk-yari-degerlendirmesi', 'Teknik direktörümüz ilk yarıyı değerlendirdi.', '<p>Ligde iyi bir konumdayız. İkinci yarıda hedefimiz üst sıralara tırmanmak.</p>', NULL, 'Maç', now() - interval '15 days');

-- Galeriler + fotoğraflar (görsel URL'leri placeholder; isterseniz Supabase Storage URL ile değiştirin)
INSERT INTO galleries (title, slug, event_date) VALUES
('Esenler Erokspor maçı', 'esenler-erokspor-maci', '2025-02-01'),
('Sezon açılışı', 'sezon-acilisi', '2024-09-01');

INSERT INTO gallery_photos (gallery_id, image_url, caption, sort_order)
SELECT g.id, 'https://placehold.co/800x600/8B1538/FFFFFF?text=Güngören+FK', 'Maç anı', 1 FROM galleries g WHERE g.slug = 'esenler-erokspor-maci'
UNION ALL SELECT g.id, 'https://placehold.co/800x600/0A0A0A/FFFFFF?text=Kadro', 'Kadro', 2 FROM galleries g WHERE g.slug = 'esenler-erokspor-maci'
UNION ALL SELECT g.id, 'https://placehold.co/800x600/8B1538/FFFFFF?text=Sezon+Açılışı', 'Sezon açılışı', 1 FROM galleries g WHERE g.slug = 'sezon-acilisi';

-- Mağaza ürünleri (ödeme yok; sadece fiyat bilgisi)
INSERT INTO store_products (name, slug, description, price, sort_order, is_active) VALUES
('Resmi Forma', 'resmi-forma', 'Bordo-beyaz resmi maç forması.', 349.00, 1, true),
('Antrenman Forması', 'antrenman-formasi', 'Siyah antrenman forması.', 199.00, 2, true),
('Atkı', 'atki', 'Kulüp atkısı.', 79.00, 3, true),
('Şapka', 'sapka', 'Güngören FK şapka.', 59.00, 4, true),
('Çocuk Forması', 'cocuk-formasi', 'Çocuk beden resmi forma.', 249.00, 5, true),
('Kaleci Eldiveni', 'kaleci-eldiveni', 'Resmi kaleci eldiveni.', 149.00, 6, true);
