-- Site ayarları (kargo vb.) — key/value
CREATE TABLE site_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO site_settings (key, value) VALUES (
  'shipping',
  '{"freeShippingThreshold": 500, "standardShippingCost": 29.9, "estimatedDeliveryDays": "2-3"}'::jsonb
);

-- RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Admin manage site_settings" ON site_settings FOR ALL USING (is_admin());

CREATE OR REPLACE FUNCTION set_site_settings_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE PROCEDURE set_site_settings_updated_at();
