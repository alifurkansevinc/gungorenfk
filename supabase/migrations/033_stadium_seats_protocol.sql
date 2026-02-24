-- Protokol koltukları: satışa kapalı ama listede görünsün (C blok orta 4x10)
ALTER TABLE stadium_seats
  ADD COLUMN IF NOT EXISTS is_protocol boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN stadium_seats.is_protocol IS 'true ise koltuk protokol; satışa kapalı, sadece görünür';

-- C blok: orta 4 sıra (5,6,7,8), orta 10 koltuk (sütun 8-17) = protokol
UPDATE stadium_seats
SET is_protocol = true
WHERE section IN ('C', 'c')
  AND row_number IN (5, 6, 7, 8)
  AND seat_in_row BETWEEN 8 AND 17;

CREATE INDEX IF NOT EXISTS idx_stadium_seats_protocol ON stadium_seats(is_protocol) WHERE is_protocol = true;
