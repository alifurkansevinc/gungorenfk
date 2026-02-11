-- Kadro: kaptan işareti ve pozisyon kategorisi (KL, Bek, Stoper, Orta Saha, Kanat, Forvet)
ALTER TABLE squad ADD COLUMN IF NOT EXISTS is_captain boolean NOT NULL DEFAULT false;
ALTER TABLE squad ADD COLUMN IF NOT EXISTS position_category text;

COMMENT ON COLUMN squad.position_category IS 'kl, bek, stoper, ortasaha, kanat, forvet - gruplama için';
