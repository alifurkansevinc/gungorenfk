-- Favori oyuncu: taraftar kadrodan bir oyuncu seçebilir; gol atarsa puan kazanacak (ileride match_goals ile)
ALTER TABLE fan_profiles
  ADD COLUMN IF NOT EXISTS favorite_player_id uuid REFERENCES squad(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_fan_profiles_favorite_player ON fan_profiles(favorite_player_id);
