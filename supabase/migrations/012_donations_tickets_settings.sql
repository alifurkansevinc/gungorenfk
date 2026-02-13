-- Bağışlar, maç biletleri (QR), site ayarları (IBAN)

-- Bağış kayıtları (iyzico ile ödeme)
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email text,
  guest_name text,
  amount decimal(12,2) NOT NULL,
  payment_status text NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING','PAID','FAILED','REFUNDED')),
  payment_id text,
  payment_token text,
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_donations_user ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_created ON donations(created_at);
CREATE INDEX IF NOT EXISTS idx_donations_payment_token ON donations(payment_token);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own donations" ON donations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role and admin manage donations" ON donations FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role' OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- Maç biletleri (QR ile giriş; satın alım sonrası oluşturulur)
CREATE TABLE IF NOT EXISTS match_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email text,
  guest_name text,
  qr_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','used','cancelled')),
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_match_tickets_match ON match_tickets(match_id);
CREATE INDEX IF NOT EXISTS idx_match_tickets_user ON match_tickets(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_match_tickets_qr ON match_tickets(qr_code);

ALTER TABLE match_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own match_tickets" ON match_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role and admin manage match_tickets" ON match_tickets FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role' OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- Site ayarları: bağış IBAN (havale ile bağış)
INSERT INTO site_settings (key, value) VALUES (
  'donation_iban',
  '{"title": "Havale ile Bağış", "iban": "TR00 0000 0000 0000 0000 0000 00", "accountName": "Güngören FK"}'::jsonb
) ON CONFLICT (key) DO NOTHING;
