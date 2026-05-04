-- Taraftar MOTM oylamasına katılan üyelerden havuz + çekiliş (admin; etkinlik başlığı ve talihli sayısı esnek)

CREATE TABLE IF NOT EXISTS motm_lottery_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  winner_count smallint NOT NULL CHECK (winner_count >= 1 AND winner_count <= 500),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pool_ready', 'drawn')),
  pool_built_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE motm_lottery_events IS 'MOTM oylaması üzerinden çekiliş etkinliği; başlık ve talihli sayısı admin tarafından belirlenir.';

CREATE TABLE IF NOT EXISTS motm_lottery_event_matches (
  event_id uuid NOT NULL REFERENCES motm_lottery_events(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  PRIMARY KEY (event_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_motm_lottery_event_matches_match ON motm_lottery_event_matches(match_id);

COMMENT ON TABLE motm_lottery_event_matches IS 'Havuza dahil maçlar; bu maçlarda oy kullanan benzersiz üyeler havuza girer.';

CREATE TABLE IF NOT EXISTS motm_lottery_pool_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES motm_lottery_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_match_count smallint NOT NULL DEFAULT 1 CHECK (source_match_count >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_motm_lottery_pool_event ON motm_lottery_pool_members(event_id);
CREATE INDEX IF NOT EXISTS idx_motm_lottery_pool_user ON motm_lottery_pool_members(user_id);

COMMENT ON TABLE motm_lottery_pool_members IS 'Havuz anlık görüntüsü; üye maçlardan en az birinde oy kullanmış olmalı.';

CREATE TABLE IF NOT EXISTS motm_lottery_draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES motm_lottery_events(id) ON DELETE CASCADE,
  pool_size_snapshot int NOT NULL CHECK (pool_size_snapshot >= 0),
  winner_count_snapshot smallint NOT NULL CHECK (winner_count_snapshot >= 1),
  random_seed_hex text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id)
);

CREATE INDEX IF NOT EXISTS idx_motm_lottery_draws_event ON motm_lottery_draws(event_id);

COMMENT ON TABLE motm_lottery_draws IS 'Etkinlik başına tek çekiliş kaydı; tohum ve havuz boyutu denetim için saklanır.';

CREATE TABLE IF NOT EXISTS motm_lottery_winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id uuid NOT NULL REFERENCES motm_lottery_draws(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place smallint NOT NULL CHECK (place >= 1),
  UNIQUE (draw_id, place),
  UNIQUE (draw_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_motm_lottery_winners_draw ON motm_lottery_winners(draw_id);

COMMENT ON TABLE motm_lottery_winners IS 'Çekiliş talihlileri; place 1 = birinci talihli vb.';

ALTER TABLE motm_lottery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE motm_lottery_event_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE motm_lottery_pool_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE motm_lottery_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE motm_lottery_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage motm_lottery_events" ON motm_lottery_events FOR ALL USING (is_admin());
CREATE POLICY "Admin manage motm_lottery_event_matches" ON motm_lottery_event_matches FOR ALL USING (is_admin());
CREATE POLICY "Admin manage motm_lottery_pool_members" ON motm_lottery_pool_members FOR ALL USING (is_admin());
CREATE POLICY "Admin manage motm_lottery_draws" ON motm_lottery_draws FOR ALL USING (is_admin());
CREATE POLICY "Admin manage motm_lottery_winners" ON motm_lottery_winners FOR ALL USING (is_admin());
