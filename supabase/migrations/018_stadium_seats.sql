-- Stadyum koltuk planı (Excel'deki X = koltuk, boş sütun = koridor).
-- Biletler artık seat_id ile bir koltuk numarasına bağlanabilir.

CREATE TABLE IF NOT EXISTS stadium_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_code text NOT NULL UNIQUE,
  section text NOT NULL,
  row_number int NOT NULL,
  seat_in_row int NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stadium_seats_section ON stadium_seats(section);
CREATE INDEX IF NOT EXISTS idx_stadium_seats_sort ON stadium_seats(sort_order);

COMMENT ON TABLE stadium_seats IS 'Stadyum koltuk planı; seat_code örn. A-1-15 (Bölüm-Sıra-Koltuk)';

ALTER TABLE match_tickets
  ADD COLUMN IF NOT EXISTS seat_id uuid REFERENCES stadium_seats(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_match_tickets_seat ON match_tickets(seat_id);

COMMENT ON COLUMN match_tickets.seat_id IS 'Atanmış koltuk (stadium_seats); null ise koltuk atanmamış eski bilet.';

ALTER TABLE stadium_seats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read stadium_seats" ON stadium_seats FOR SELECT USING (true);
