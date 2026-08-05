-- Optaport maç eşleştirmesi (fikstür + kafile sync)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS optaport_match_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_optaport_match_id
  ON matches (optaport_match_id)
  WHERE optaport_match_id IS NOT NULL;

COMMENT ON COLUMN matches.optaport_match_id IS 'Optaport matches.id — köprü sync eşleştirmesi';
