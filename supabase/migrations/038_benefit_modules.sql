-- Avantaj modülleri: Admin'in rütbelere atayabildiği hak tipleri (indirim %, hediye adedi, daimi koltuk vb.)
-- value_type: percent = oran (örn. 25), number = adet (örn. 2), boolean = var/yok (1/0)

CREATE TABLE benefit_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  value_type text NOT NULL CHECK (value_type IN ('percent', 'number', 'boolean')),
  unit_label text NOT NULL DEFAULT '',
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_benefit_modules_sort ON benefit_modules(sort_order);

COMMENT ON TABLE benefit_modules IS 'Rütbelere atanabilen avantaj tipleri (indirim, hediye, daimi koltuk vb.)';
COMMENT ON COLUMN benefit_modules.value_type IS 'percent=oran, number=adet, boolean=var/yok';
COMMENT ON COLUMN benefit_modules.unit_label IS 'Gösterim için birim: %, adet, yılda vb.';

-- Rütbe–modül ataması: hangi rütbede hangi modül, hangi değerle (örn. %25, 2 adet)
CREATE TABLE fan_level_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_level_id smallint NOT NULL REFERENCES fan_levels(id) ON DELETE CASCADE,
  benefit_module_id uuid NOT NULL REFERENCES benefit_modules(id) ON DELETE CASCADE,
  value decimal(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(fan_level_id, benefit_module_id)
);

CREATE INDEX idx_fan_level_benefits_level ON fan_level_benefits(fan_level_id);
CREATE INDEX idx_fan_level_benefits_module ON fan_level_benefits(benefit_module_id);

COMMENT ON TABLE fan_level_benefits IS 'Rütbeye atanmış avantaj modülleri ve değerleri (indirim %, hediye adedi vb.)';

ALTER TABLE benefit_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_level_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read benefit_modules" ON benefit_modules FOR SELECT USING (true);
CREATE POLICY "Admin manage benefit_modules" ON benefit_modules FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role' OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

CREATE POLICY "Public read fan_level_benefits" ON fan_level_benefits FOR SELECT USING (true);
CREATE POLICY "Admin manage fan_level_benefits" ON fan_level_benefits FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role' OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- Varsayılan modüller
INSERT INTO benefit_modules (name, slug, value_type, unit_label, sort_order) VALUES
  ('Daimi koltuk bileti alma', 'daimi_koltuk', 'boolean', '', 1),
  ('Storedan indirim hakkı', 'store_discount', 'percent', '%', 2),
  ('Hediye hakkı', 'hediye_hakki', 'number', 'adet/yılda', 3);
