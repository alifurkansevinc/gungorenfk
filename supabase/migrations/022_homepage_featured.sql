-- Anasayfa öne çıkan modüller (max 5, sıralanabilir, resim değiştirilebilir)

CREATE TABLE IF NOT EXISTS homepage_featured (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text NOT NULL,
  title text,
  subtitle text,
  image_url text NOT NULL,
  link text,
  is_large boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_homepage_featured_sort ON homepage_featured(sort_order);

ALTER TABLE homepage_featured ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read homepage_featured" ON homepage_featured FOR SELECT USING (true);
CREATE POLICY "Admin manage homepage_featured" ON homepage_featured FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role' OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

COMMENT ON TABLE homepage_featured IS 'Anasayfa öne çıkan bölümü: modül listesi (max 5), sıra ve resim yönetimi';
COMMENT ON COLUMN homepage_featured.is_large IS 'true ise kart büyük (2x2 grid), sadece bir tane olabilir';
