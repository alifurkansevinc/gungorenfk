-- Transferler: oyuncu, geldiği takım, gittiği takım, sezonluk istatistikler

CREATE TABLE IF NOT EXISTS transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name text NOT NULL,
  player_image_url text,
  from_team_name text NOT NULL,
  from_team_league text,
  to_team_name text NOT NULL,
  to_team_league text,
  transfer_date date,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transfer_season_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_id uuid NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
  season_label text NOT NULL,
  matches_played int NOT NULL DEFAULT 0,
  goals int NOT NULL DEFAULT 0,
  assists int NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transfers_sort ON transfers(sort_order);
CREATE INDEX IF NOT EXISTS idx_transfer_season_stats_transfer ON transfer_season_stats(transfer_id);

ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_season_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read transfers" ON transfers FOR SELECT USING (true);
CREATE POLICY "Public read transfer_season_stats" ON transfer_season_stats FOR SELECT USING (true);
CREATE POLICY "Admin manage transfers" ON transfers FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role' OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);
CREATE POLICY "Admin manage transfer_season_stats" ON transfer_season_stats FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role' OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

COMMENT ON TABLE transfers IS 'Transfer kayıtları: oyuncu, geldiği/gittiği takım ve lig bilgileri';
COMMENT ON TABLE transfer_season_stats IS 'Transfer başına sezonluk maç, gol, asist';
