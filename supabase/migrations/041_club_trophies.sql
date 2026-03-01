-- Tarihi ve Kupa Müzesi: admin tarafından eklenen kupalar (isim, yıl, resim, açıklama)

CREATE TABLE club_trophies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  year smallint NOT NULL,
  image_url text,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_club_trophies_sort ON club_trophies(sort_order);
CREATE INDEX idx_club_trophies_active ON club_trophies(is_active);

COMMENT ON TABLE club_trophies IS 'Kulüp kupa müzesi: Kupa ismi, yılı, resmi ve açıklaması';

ALTER TABLE club_trophies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read club_trophies" ON club_trophies FOR SELECT USING (true);
CREATE POLICY "Admin manage club_trophies" ON club_trophies FOR ALL USING (is_admin());
