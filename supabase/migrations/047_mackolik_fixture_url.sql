-- Mackolik fikstür sayfası linki; admin panelinden güncellenebilir (link değişince sayfa yapısı aynıysa entegre çalışır).
INSERT INTO site_settings (key, value) VALUES (
  'mackolik_fixture_url',
  '"https://www.mackolik.com/takim/g%C3%BCng%C3%B6ren-belediyesi-spor-kul%C3%BCb%C3%BC/ma%C3%A7lar/macko17420477681804340168"'::jsonb
) ON CONFLICT (key) DO NOTHING;
