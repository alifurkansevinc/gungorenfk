-- Maç bitiş anı: başlangıç + 2 saat (uygulama tarafından doldurulur; sorgu ve senkron için)
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS match_end_at timestamptz;

COMMENT ON COLUMN matches.match_end_at IS 'Kickoff (TR) + 2 saat; otomatik canlı/bitti senkronu için referans.';
