-- technical_staff ve board_members tabloları yoksa oluştur (004 atlanmışsa schema cache hatası alınır)
-- Bu migration'ı Supabase SQL Editor'da çalıştırabilirsiniz.

CREATE TABLE IF NOT EXISTS board_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role_slug text NOT NULL,
  photo_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS technical_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role_slug text NOT NULL,
  photo_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_board_members_role ON board_members(role_slug);
CREATE INDEX IF NOT EXISTS idx_board_members_sort ON board_members(sort_order);
CREATE INDEX IF NOT EXISTS idx_technical_staff_role ON technical_staff(role_slug);
CREATE INDEX IF NOT EXISTS idx_technical_staff_sort ON technical_staff(sort_order);

ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_staff ENABLE ROW LEVEL SECURITY;

-- is_admin() 001'de tanımlı; 001 atlanmışsa burada oluştur
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "Public read board_members" ON board_members;
DROP POLICY IF EXISTS "Admin manage board_members" ON board_members;
CREATE POLICY "Public read board_members" ON board_members FOR SELECT USING (true);
CREATE POLICY "Admin manage board_members" ON board_members FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Public read technical_staff" ON technical_staff;
DROP POLICY IF EXISTS "Admin manage technical_staff" ON technical_staff;
CREATE POLICY "Public read technical_staff" ON technical_staff FOR SELECT USING (true);
CREATE POLICY "Admin manage technical_staff" ON technical_staff FOR ALL USING (is_admin());

-- İlk kez oluşturulduysa demo veri (teknik_staff için; board_members zaten 004'te dolu olabilir)
INSERT INTO technical_staff (name, role_slug, sort_order)
SELECT 'Ahmet Hoca', 'teknik_direktor', 1
WHERE NOT EXISTS (SELECT 1 FROM technical_staff LIMIT 1);
