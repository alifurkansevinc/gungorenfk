-- Kadro sezon bazlı gösterim: 24-25 Şampiyon Kadromuz, 26-27 Sezon Kadrosu vb.
ALTER TABLE squad ADD COLUMN IF NOT EXISTS season text;

COMMENT ON COLUMN squad.season IS 'Örn: 24-25 Şampiyon Kadromuz, 26-27 Sezon Kadrosu; frontend sezonlara göre gruplar, en son sezon açık.';

CREATE INDEX IF NOT EXISTS idx_squad_season ON squad(season);
