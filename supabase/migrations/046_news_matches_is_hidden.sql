-- Her etkinlik ve her maç için ayrı pasif (gizle) alanı
ALTER TABLE news ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN news.is_hidden IS 'Pasif ise sitede (etkinlikler listesi, biletler vb.) gösterilmez.';
COMMENT ON COLUMN matches.is_hidden IS 'Pasif ise sitede (maçlar listesi, biletler vb.) gösterilmez.';
