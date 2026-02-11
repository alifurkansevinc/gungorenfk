-- Yönetim Kurulu: Başkan, Başkanvekili, As Başkanlar, YK Üyeleri, Yüksek İstişare Heyeti (4), Danışmanlar
-- Teknik Heyet: Teknik Direktör, Yardımcı Hoca, Kaleci Antrenörü, Altyapı TD, Gelişim Direktörü, Futbol Direktörü, Kulüp Müdürü, Lojistik Müdürü, Fizyoterapist

CREATE TABLE board_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role_slug text NOT NULL,
  photo_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_board_members_role ON board_members(role_slug);
CREATE INDEX idx_board_members_sort ON board_members(sort_order);

COMMENT ON COLUMN board_members.role_slug IS 'baskan, baskan_vekili, as_baskan, yk_uyesi, yuksek_istisare_heyeti, danisman';

CREATE TABLE technical_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role_slug text NOT NULL,
  photo_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_technical_staff_role ON technical_staff(role_slug);
CREATE INDEX idx_technical_staff_sort ON technical_staff(sort_order);

COMMENT ON COLUMN technical_staff.role_slug IS 'teknik_direktor, yardimci_hoca, kaleci_antrenoru, altyapi_td, gelisim_direktoru, futbol_direktoru, kulup_muduru, lojistik_muduru, fizyoterapist';

ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read board_members" ON board_members FOR SELECT USING (true);
CREATE POLICY "Public read technical_staff" ON technical_staff FOR SELECT USING (true);
CREATE POLICY "Admin manage board_members" ON board_members FOR ALL USING (is_admin());
CREATE POLICY "Admin manage technical_staff" ON technical_staff FOR ALL USING (is_admin());

-- Demo veri (isteğe göre admin'den düzenlenir)
INSERT INTO board_members (name, role_slug, sort_order) VALUES
  ('Ahmet Yılmaz', 'baskan', 1),
  ('Mehmet Kaya', 'baskan_vekili', 2),
  ('Ali Demir', 'as_baskan', 3),
  ('Ayşe Özkan', 'as_baskan', 4),
  ('Fatma Çelik', 'yk_uyesi', 5),
  ('Mustafa Arslan', 'yk_uyesi', 6),
  ('Zeynep Aydın', 'yk_uyesi', 7),
  ('Kemal Yıldız', 'yuksek_istisare_heyeti', 8),
  ('Selma Koç', 'yuksek_istisare_heyeti', 9),
  ('Cem Öztürk', 'yuksek_istisare_heyeti', 10),
  ('Deniz Şahin', 'yuksek_istisare_heyeti', 11),
  ('Emre Danışman', 'danisman', 12),
  ('Elif Danışman', 'danisman', 13);

INSERT INTO technical_staff (name, role_slug, sort_order) VALUES
  ('Ahmet Hoca', 'teknik_direktor', 1),
  ('Mehmet Yardımcı', 'yardimci_hoca', 2),
  ('Ali Kaleci Antrenörü', 'kaleci_antrenoru', 3),
  ('Can Altyapı', 'altyapi_td', 4),
  ('Barış Gelişim', 'gelisim_direktoru', 5),
  ('Cem Futbol', 'futbol_direktoru', 6),
  ('Deniz Kulüp', 'kulup_muduru', 7),
  ('Ece Lojistik', 'lojistik_muduru', 8),
  ('Fulya Fizyoterapist', 'fizyoterapist', 9);
