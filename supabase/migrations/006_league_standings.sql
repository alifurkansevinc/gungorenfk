-- Puan durumu (Mackolik sync veya manuel). Lig adı, sezon, son güncelleme.
CREATE TABLE league_standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  league_name text NOT NULL,
  season text NOT NULL,
  position int NOT NULL,
  team_name text NOT NULL,
  played int NOT NULL DEFAULT 0,
  goal_diff int NOT NULL DEFAULT 0,
  wins int NOT NULL DEFAULT 0,
  draws int NOT NULL DEFAULT 0,
  losses int NOT NULL DEFAULT 0,
  goals_for int NOT NULL DEFAULT 0,
  goals_against int NOT NULL DEFAULT 0,
  points int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(league_name, season, position)
);

CREATE INDEX idx_league_standings_league_season ON league_standings(league_name, season);

ALTER TABLE league_standings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read league_standings" ON league_standings FOR SELECT USING (true);
-- Sync sadece server/service role veya admin ile yapılır (API route server-side insert)

COMMENT ON TABLE league_standings IS 'Mackolik puan durumu sync (günde bir veya cron).';
