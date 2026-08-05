-- Aynı oyuncu birden fazla sezonda ayrı squad satırı olabilir (maç / tarih kadro).
-- Eşleştirme: optaport_player_id + season (uygulama katmanı).

DROP INDEX IF EXISTS idx_squad_optaport_player_id;

CREATE INDEX IF NOT EXISTS idx_squad_optaport_player_id
  ON squad (optaport_player_id)
  WHERE optaport_player_id IS NOT NULL;

COMMENT ON COLUMN squad.optaport_player_id IS
  'Optaport players.id — köprü sync; sezon başına ayrı satır olabilir (unique değil).';
