-- Güngören FK: İlk şema + 81 il, ilçe, mahalle (Güngören), taraftar, maç, kadro, haber, galeri, mağaza, rozet kademeleri

-- 1) Rozet kademeleri (5 kademe)
CREATE TABLE fan_levels (
  id smallint PRIMARY KEY,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  min_points int NOT NULL DEFAULT 0,
  sort_order smallint NOT NULL DEFAULT 0
);

INSERT INTO fan_levels (id, name, slug, min_points, sort_order) VALUES
(1, 'Beyaz', 'beyaz', 0, 1),
(2, 'Bronz', 'bronz', 100, 2),
(3, 'Gümüş', 'gumus', 300, 3),
(4, 'Altın', 'altin', 600, 4),
(5, 'Platinium', 'platinium', 1000, 5);

-- 2) İller (81 il)
CREATE TABLE cities (
  id smallint PRIMARY KEY,
  name text NOT NULL,
  plate_no smallint NOT NULL UNIQUE
);

INSERT INTO cities (id, name, plate_no) VALUES
(1,'Adana',1),(2,'Adıyaman',2),(3,'Afyonkarahisar',3),(4,'Ağrı',4),(5,'Amasya',5),(6,'Ankara',6),(7,'Antalya',7),(8,'Artvin',8),(9,'Aydın',9),(10,'Balıkesir',10),(11,'Bilecik',11),(12,'Bingöl',12),(13,'Bitlis',13),(14,'Bolu',14),(15,'Burdur',15),(16,'Bursa',16),(17,'Çanakkale',17),(18,'Çankırı',18),(19,'Çorum',19),(20,'Denizli',20),(21,'Diyarbakır',21),(22,'Edirne',22),(23,'Elazığ',23),(24,'Erzincan',24),(25,'Erzurum',25),(26,'Eskişehir',26),(27,'Gaziantep',27),(28,'Giresun',28),(29,'Gümüşhane',29),(30,'Hakkari',30),(31,'Hatay',31),(32,'Isparta',32),(33,'Mersin',33),(34,'İstanbul',34),(35,'İzmir',35),(36,'Kars',36),(37,'Kastamonu',37),(38,'Kayseri',38),(39,'Kırklareli',39),(40,'Kırşehir',40),(41,'Kocaeli',41),(42,'Konya',42),(43,'Kütahya',43),(44,'Malatya',44),(45,'Manisa',45),(46,'Kahramanmaraş',46),(47,'Mardin',47),(48,'Muğla',48),(49,'Muş',49),(50,'Nevşehir',50),(51,'Niğde',51),(52,'Ordu',52),(53,'Rize',53),(54,'Sakarya',54),(55,'Samsun',55),(56,'Siirt',56),(57,'Sinop',57),(58,'Sivas',58),(59,'Tekirdağ',59),(60,'Tokat',60),(61,'Trabzon',61),(62,'Tunceli',62),(63,'Şanlıurfa',63),(64,'Uşak',64),(65,'Van',65),(66,'Yozgat',66),(67,'Zonguldak',67),(68,'Aksaray',68),(69,'Bayburt',69),(70,'Karaman',70),(71,'Kırıkkale',71),(72,'Batman',72),(73,'Şırnak',73),(74,'Bartın',74),(75,'Ardahan',75),(76,'Iğdır',76),(77,'Yalova',77),(78,'Karabük',78),(79,'Kilis',79),(80,'Osmaniye',80),(81,'Düzce',81);

-- 3) İlçeler (şimdilik sadece İstanbul 39 ilçe – diğer iller sonra eklenebilir)
CREATE TABLE districts (
  id serial PRIMARY KEY,
  city_id smallint NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name text NOT NULL,
  UNIQUE(city_id, name)
);

CREATE INDEX idx_districts_city ON districts(city_id);

-- İstanbul ilçeleri (34 = İstanbul)
INSERT INTO districts (city_id, name) VALUES
(34,'Adalar'),(34,'Arnavutköy'),(34,'Ataşehir'),(34,'Avcılar'),(34,'Bağcılar'),(34,'Bahçelievler'),(34,'Bakırköy'),(34,'Başakşehir'),(34,'Bayrampaşa'),(34,'Beşiktaş'),(34,'Beykoz'),(34,'Beylikdüzü'),(34,'Beyoğlu'),(34,'Büyükçekmece'),(34,'Çatalca'),(34,'Çekmeköy'),(34,'Esenler'),(34,'Esenyurt'),(34,'Eyüpsultan'),(34,'Fatih'),(34,'Gaziosmanpaşa'),(34,'Güngören'),(34,'Kadıköy'),(34,'Kağıthane'),(34,'Kartal'),(34,'Küçükçekmece'),(34,'Maltepe'),(34,'Pendik'),(34,'Sancaktepe'),(34,'Sarıyer'),(34,'Silivri'),(34,'Sultanbeyli'),(34,'Sultangazi'),(34,'Şile'),(34,'Şişli'),(34,'Tuzla'),(34,'Ümraniye'),(34,'Üsküdar'),(34,'Zeytinburnu');

-- 4) Mahalleler (sadece Güngören ilçesi – İstanbul)
CREATE TABLE neighbourhoods (
  id serial PRIMARY KEY,
  district_id int NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  name text NOT NULL,
  UNIQUE(district_id, name)
);

CREATE INDEX idx_neighbourhoods_district ON neighbourhoods(district_id);

-- Güngören ilçesi mahalleleri
INSERT INTO neighbourhoods (district_id, name)
SELECT (SELECT id FROM districts WHERE city_id = 34 AND name = 'Güngören'), n FROM (VALUES
  ('Abdurrahman Nafiz Gürman Mahallesi'),('Akıncılar Mahallesi'),('Gençosman Mahallesi'),('Güneştepe Mahallesi'),('Güven Mahallesi'),('Haznedar Mahallesi'),('Mareşal Çakmak Mahallesi'),('Mehmet Nesih Özmen Mahallesi'),('Merkez Mahallesi'),('Sanayi Mahallesi'),('Tozkoparan Mahallesi')
) AS t(n);

-- 5) Taraftar profili (Supabase Auth ile eşleşir; auth.users.id = user_id)
CREATE TABLE fan_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  memleket_city_id smallint NOT NULL REFERENCES cities(id),
  residence_city_id smallint NOT NULL REFERENCES cities(id),
  residence_district_id int REFERENCES districts(id),
  residence_neighbourhood_id int REFERENCES neighbourhoods(id),
  birth_year int,
  email text NOT NULL,
  fan_level_id smallint NOT NULL DEFAULT 1 REFERENCES fan_levels(id),
  points int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fan_profiles_user ON fan_profiles(user_id);
CREATE INDEX idx_fan_profiles_memleket ON fan_profiles(memleket_city_id);
CREATE INDEX idx_fan_profiles_level ON fan_profiles(fan_level_id);

-- 6) Maçlar
CREATE TABLE matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opponent_name text NOT NULL,
  home_away text NOT NULL CHECK (home_away IN ('home','away')),
  venue text,
  match_date date NOT NULL,
  competition text,
  season text,
  goals_for int,
  goals_against int,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','finished','postponed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_season ON matches(season);

-- 7) Kadro
CREATE TABLE squad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  shirt_number int,
  position text,
  photo_url text,
  bio text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8) Haberler
CREATE TABLE news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  body text,
  image_url text,
  category text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_news_published ON news(published_at);
CREATE INDEX idx_news_slug ON news(slug);

-- 9) Galeriler
CREATE TABLE galleries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  event_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id uuid NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_gallery_photos_gallery ON gallery_photos(gallery_id);

-- 10) Mağaza ürünleri (ödeme yok; sadece fiyat ve ürün)
CREATE TABLE store_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price decimal(12,2) NOT NULL,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_store_products_active ON store_products(is_active);

-- 11) Admin kullanıcıları (admin panel erişimi)
CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: public tablolar için
ALTER TABLE fan_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighbourhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilsin: fan_levels, cities, districts, neighbourhoods, matches, squad, news, galleries, gallery_photos, store_products
CREATE POLICY "Public read fan_levels" ON fan_levels FOR SELECT USING (true);
CREATE POLICY "Public read cities" ON cities FOR SELECT USING (true);
CREATE POLICY "Public read districts" ON districts FOR SELECT USING (true);
CREATE POLICY "Public read neighbourhoods" ON neighbourhoods FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public read squad" ON squad FOR SELECT USING (true);
CREATE POLICY "Public read news" ON news FOR SELECT USING (true);
CREATE POLICY "Public read galleries" ON galleries FOR SELECT USING (true);
CREATE POLICY "Public read gallery_photos" ON gallery_photos FOR SELECT USING (true);
CREATE POLICY "Public read store_products" ON store_products FOR SELECT USING (true);

-- fan_profiles: kullanıcı kendi kaydını okuyabilsin/güncelleyebilsin; kayıt sırasında insert (anon veya authenticated)
CREATE POLICY "Users read own fan_profile" ON fan_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own fan_profile" ON fan_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow insert own fan_profile" ON fan_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin kontrolü: admin_users'da olan kullanıcı tüm içeriği yönetebilir
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- İçerik tablolarında admin yazabilsin
CREATE POLICY "Admin manage matches" ON matches FOR ALL USING (is_admin());
CREATE POLICY "Admin manage squad" ON squad FOR ALL USING (is_admin());
CREATE POLICY "Admin manage news" ON news FOR ALL USING (is_admin());
CREATE POLICY "Admin manage galleries" ON galleries FOR ALL USING (is_admin());
CREATE POLICY "Admin manage gallery_photos" ON gallery_photos FOR ALL USING (is_admin());
CREATE POLICY "Admin manage store_products" ON store_products FOR ALL USING (is_admin());
CREATE POLICY "Admin read fan_profiles" ON fan_profiles FOR SELECT USING (is_admin());
CREATE POLICY "Admin read admin_users" ON admin_users FOR SELECT USING (is_admin());
CREATE POLICY "Admin insert admin_users" ON admin_users FOR INSERT WITH CHECK (is_admin());
-- Kullanıcı kendi admin olup olmadığını okuyabilsin (admin girişi için)
CREATE POLICY "Users read own admin status" ON admin_users FOR SELECT USING (auth.uid() = user_id);
