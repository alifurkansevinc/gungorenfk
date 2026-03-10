-- Menü pasif tuşları (Etkinlikler / Maçlar gizlensin) + hediye hakkı ürün listesi
INSERT INTO site_settings (key, value) VALUES
  ('nav_etkinlikler_hidden', 'false'::jsonb),
  ('nav_maclar_hidden', 'false'::jsonb),
  ('gift_eligible_product_ids', '[]'::jsonb)
ON CONFLICT (key) DO NOTHING;
