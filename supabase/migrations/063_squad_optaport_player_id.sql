-- Optaport oyuncu eşleştirmesi (kadrolar arası foto sync)
ALTER TABLE squad ADD COLUMN IF NOT EXISTS optaport_player_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS idx_squad_optaport_player_id
  ON squad (optaport_player_id)
  WHERE optaport_player_id IS NOT NULL;

COMMENT ON COLUMN squad.optaport_player_id IS 'Optaport players.id — köprü sync eşleştirmesi';
