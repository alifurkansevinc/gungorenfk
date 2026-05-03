-- Taraftar maçın oyuncusu oylaması (tek oy, değiştirilemez) + haftanın oyuncusu vitrin kaydı

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS motm_vote_starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS motm_vote_ends_at timestamptz;

COMMENT ON COLUMN matches.motm_vote_starts_at IS 'Taraftar oylaması başlangıç (admin)';
COMMENT ON COLUMN matches.motm_vote_ends_at IS 'Taraftar oylaması bitiş (admin)';

CREATE TABLE IF NOT EXISTS match_motm_candidates (
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  squad_member_id uuid NOT NULL REFERENCES squad(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (match_id, squad_member_id)
);

CREATE INDEX IF NOT EXISTS idx_match_motm_candidates_match ON match_motm_candidates(match_id);

COMMENT ON TABLE match_motm_candidates IS 'Oylamada sunulan adaylar (kadrodan seçilir, admin)';

CREATE TABLE IF NOT EXISTS match_motm_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  squad_member_id uuid NOT NULL REFERENCES squad(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_match_motm_votes_match ON match_motm_votes(match_id);
CREATE INDEX IF NOT EXISTS idx_match_motm_votes_user ON match_motm_votes(user_id);

COMMENT ON TABLE match_motm_votes IS 'Üye başına maç başına tek oy; uygulama service role ile yazar.';

CREATE TABLE IF NOT EXISTS week_player_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season text NOT NULL,
  week_number smallint NOT NULL CHECK (week_number >= 1 AND week_number <= 53),
  match_id uuid REFERENCES matches(id) ON DELETE SET NULL,
  squad_id uuid NOT NULL REFERENCES squad(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (season, week_number)
);

CREATE INDEX IF NOT EXISTS idx_week_player_awards_season ON week_player_awards(season);

COMMENT ON TABLE week_player_awards IS 'Haftanın oyuncusu duyurusu; web sitesinde kalıcı vitrin.';

ALTER TABLE match_motm_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_motm_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE week_player_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read match_motm_candidates" ON match_motm_candidates FOR SELECT USING (true);
CREATE POLICY "Admin manage match_motm_candidates" ON match_motm_candidates FOR ALL USING (is_admin());

CREATE POLICY "Public read week_player_awards" ON week_player_awards FOR SELECT USING (true);
CREATE POLICY "Admin manage week_player_awards" ON week_player_awards FOR ALL USING (is_admin());

-- Oy tablosu: istemciden doğrudan yazım yok; yalnızca service role (API) kullanır
CREATE POLICY "Admin read match_motm_votes" ON match_motm_votes FOR SELECT USING (is_admin());
