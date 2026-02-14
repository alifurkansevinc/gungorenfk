-- Önümüzdeki maç kartı: maç saati ve rakip takım logosu

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS match_time text,
  ADD COLUMN IF NOT EXISTS opponent_logo_url text;

COMMENT ON COLUMN matches.match_time IS 'Maç saati, örn. 14:00';
COMMENT ON COLUMN matches.opponent_logo_url IS 'Rakip takım logosu URL (önümüzdeki maç kartında gösterilir)';
