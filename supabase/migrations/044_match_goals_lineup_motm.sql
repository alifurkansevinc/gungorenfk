-- Maç skoru detayları: attığımız goller (dakika, atan, asist), ilk 11, yedekler, maçın oyuncusu.
-- Kadro istatistikleri (gol, asist, maça çıkma) bu tablolardan hesaplanacak.

-- Maçın oyuncusu (favori oyuncu bonusu için)
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS man_of_the_match_id uuid REFERENCES squad(id) ON DELETE SET NULL;

COMMENT ON COLUMN matches.man_of_the_match_id IS 'Maçın oyuncusu; favori oyuncusu bu olan taraftarlar +%5 barem alır.';

-- Attığımız her gol: dakika, atan, asist (kadrodan)
CREATE TABLE IF NOT EXISTS match_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  minute smallint NOT NULL,
  scorer_squad_id uuid NOT NULL REFERENCES squad(id) ON DELETE CASCADE,
  assist_squad_id uuid REFERENCES squad(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_match_goals_match ON match_goals(match_id);
CREATE INDEX IF NOT EXISTS idx_match_goals_scorer ON match_goals(scorer_squad_id);
CREATE INDEX IF NOT EXISTS idx_match_goals_assist ON match_goals(assist_squad_id);

COMMENT ON TABLE match_goals IS 'Attığımız goller: dakika, atan oyuncu, asist yapan (opsiyonel).';

-- İlk 11 ve yedekler (kadrodan seçim)
CREATE TABLE IF NOT EXISTS match_lineups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  squad_member_id uuid NOT NULL REFERENCES squad(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('starter', 'substitute')),
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(match_id, squad_member_id)
);

CREATE INDEX IF NOT EXISTS idx_match_lineups_match ON match_lineups(match_id);
CREATE INDEX IF NOT EXISTS idx_match_lineups_squad ON match_lineups(squad_member_id);

COMMENT ON TABLE match_lineups IS 'Maç kadrosu: ilk 11 (starter) ve yedekler (substitute).';

ALTER TABLE match_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_lineups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read match_goals" ON match_goals FOR SELECT USING (true);
CREATE POLICY "Public read match_lineups" ON match_lineups FOR SELECT USING (true);
CREATE POLICY "Admin manage match_goals" ON match_goals FOR ALL USING (is_admin());
CREATE POLICY "Admin manage match_lineups" ON match_lineups FOR ALL USING (is_admin());
