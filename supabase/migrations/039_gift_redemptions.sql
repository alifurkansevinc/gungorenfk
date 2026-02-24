-- Hediye hakkı: Rütbeden kazanılan hediye hakları mağaza ürünü olarak verilir; ücretsiz, QR ile mağazadan teslim alınır.

CREATE TABLE gift_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES store_products(id) ON DELETE CASCADE,
  qr_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending_pickup' CHECK (status IN ('pending_pickup', 'picked_up')),
  picked_up_at timestamptz,
  redemption_year smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_gift_redemptions_user ON gift_redemptions(user_id);
CREATE INDEX idx_gift_redemptions_qr ON gift_redemptions(qr_code);
CREATE INDEX idx_gift_redemptions_user_year ON gift_redemptions(user_id, redemption_year);

COMMENT ON TABLE gift_redemptions IS 'Hediye hakkı kullanımı: mağaza ürünü ücretsiz, QR ile mağazadan teslim alınır';
COMMENT ON COLUMN gift_redemptions.redemption_year IS 'Yıllık kota hesabı için (örn. 2025)';

ALTER TABLE gift_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own gift_redemptions" ON gift_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own gift_redemptions" ON gift_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role and admin manage gift_redemptions" ON gift_redemptions FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role' OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);
