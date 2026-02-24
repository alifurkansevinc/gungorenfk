-- Etkinlikler: biletli/biletsiz ayrımı; biletli etkinlikler için bilet (koltuk seçimi yok)

-- news: biletli etkinlik mi?
ALTER TABLE news ADD COLUMN IF NOT EXISTS is_ticketed boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN news.is_ticketed IS 'true ise etkinlik biletlidir; biletler sayfasından bilet alınır (koltuk seçimi yok).';

-- match_tickets: etkinlik biletleri (match_id veya event_id biri dolu)
ALTER TABLE match_tickets ALTER COLUMN match_id DROP NOT NULL;
ALTER TABLE match_tickets ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES news(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_match_tickets_event ON match_tickets(event_id);

ALTER TABLE match_tickets ADD CONSTRAINT chk_match_tickets_match_or_event
  CHECK (
    (match_id IS NOT NULL AND event_id IS NULL) OR
    (match_id IS NULL AND event_id IS NOT NULL)
  );

COMMENT ON COLUMN match_tickets.event_id IS 'Biletli etkinlik (news) id; dolu ise match_id null, koltuk seçimi yok.';
