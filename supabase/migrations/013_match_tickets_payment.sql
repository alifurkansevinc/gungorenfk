-- Bilet satın alımı için ödeme alanları

ALTER TABLE match_tickets
  ADD COLUMN IF NOT EXISTS payment_token text,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'PENDING'
    CHECK (payment_status IN ('PENDING','PAID','FAILED'));

CREATE INDEX IF NOT EXISTS idx_match_tickets_payment_token ON match_tickets(payment_token);

COMMENT ON COLUMN match_tickets.payment_token IS 'iyzico checkout token; ödeme sonrası temizlenir';
COMMENT ON COLUMN match_tickets.payment_status IS 'PENDING=ödeme bekliyor, PAID=ödenmiş, FAILED=başarısız';
