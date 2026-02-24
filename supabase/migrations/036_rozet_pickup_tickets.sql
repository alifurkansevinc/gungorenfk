-- Taraftar rozet teslim bileti: Üye rozeti kazandığı için mağazadan teslim alırken gösterilecek QR bilet. Kullanıldıktan sonra listeden düşer.

CREATE TABLE rozet_pickup_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  qr_code text NOT NULL UNIQUE,
  used_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rozet_pickup_tickets_user ON rozet_pickup_tickets(user_id);
CREATE INDEX idx_rozet_pickup_tickets_qr ON rozet_pickup_tickets(qr_code);
CREATE INDEX idx_rozet_pickup_tickets_used ON rozet_pickup_tickets(used_at) WHERE used_at IS NULL;

COMMENT ON TABLE rozet_pickup_tickets IS 'Taraftar rozet teslim bileti; mağazada QR okutulunca used_at set edilir ve Benim Köşemden kaybolur';

ALTER TABLE rozet_pickup_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own rozet_pickup_tickets"
  ON rozet_pickup_tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own rozet_pickup_tickets"
  ON rozet_pickup_tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role and admin manage rozet_pickup_tickets"
  ON rozet_pickup_tickets FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- Mevcut taraftarlara birer rozet teslim bileti ver (henüz kullanılmamış biletı olmayanlara)
INSERT INTO rozet_pickup_tickets (user_id, qr_code)
SELECT fp.user_id, 'RZ-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 12))
FROM fan_profiles fp
WHERE NOT EXISTS (SELECT 1 FROM rozet_pickup_tickets r WHERE r.user_id = fp.user_id AND r.used_at IS NULL);
