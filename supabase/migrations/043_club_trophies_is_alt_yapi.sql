-- Altyapı kupaları: işaretlenen kupalar ileride altyapı sayfasında sezon sezon gösterilebilir

ALTER TABLE club_trophies
  ADD COLUMN IF NOT EXISTS is_alt_yapi boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN club_trophies.is_alt_yapi IS 'Altyapı kupası ise altyapı sayfasında sezon bazlı listelenir; ana kupa müzesinde gösterilmez';
