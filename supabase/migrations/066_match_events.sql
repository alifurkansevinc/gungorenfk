-- Optaport maç olayları (gol, kart, değişiklik, sakatlık, rakip gol)
CREATE TABLE IF NOT EXISTS match_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  optaport_event_id uuid,
  minute smallint,
  event_type text NOT NULL CHECK (
    event_type IN (
      'goal',
      'assist',
      'yellow_card',
      'red_card',
      'sub_in',
      'sub_out',
      'injury',
      'opponent_goal'
    )
  ),
  player_name text,
  player_squad_id uuid REFERENCES squad(id) ON DELETE SET NULL,
  optaport_player_id uuid,
  related_player_name text,
  related_squad_id uuid REFERENCES squad(id) ON DELETE SET NULL,
  related_optaport_player_id uuid,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id);
CREATE INDEX IF NOT EXISTS idx_match_events_type ON match_events(match_id, event_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_match_events_optaport_event_id
  ON match_events(optaport_event_id)
  WHERE optaport_event_id IS NOT NULL;

COMMENT ON TABLE match_events IS 'Optaport’tan sync edilen maç olayları (dakika dakika).';

ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read match_events" ON match_events FOR SELECT USING (true);
CREATE POLICY "Admin manage match_events" ON match_events FOR ALL USING (is_admin());
