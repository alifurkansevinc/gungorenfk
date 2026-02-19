-- Transfer: oyuncu mevkii ve yaşı

ALTER TABLE transfers
  ADD COLUMN IF NOT EXISTS position text,
  ADD COLUMN IF NOT EXISTS age int;

COMMENT ON COLUMN transfers.position IS 'Oyuncu mevkii (örn: Kaleci, Defans, Orta Saha, Forvet)';
COMMENT ON COLUMN transfers.age IS 'Oyuncu yaşı';
