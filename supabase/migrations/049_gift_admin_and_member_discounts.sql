-- Admin tarafından verilen hediyeler (QR ile üye teslim alır); beyaz rozet artık mağazada ücretsiz değil, admin hediye olarak verir.
ALTER TABLE gift_redemptions
  ADD COLUMN IF NOT EXISTS granted_by_admin boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN gift_redemptions.granted_by_admin IS 'true ise admin tarafından verildi, kullanıcı kotasına sayılmaz';

-- Üye bazlı ürün indirimi: admin belirli üyeye belirli ürün için indirim oranı atar (ürün ürün).
CREATE TABLE IF NOT EXISTS member_product_discounts (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES store_products(id) ON DELETE CASCADE,
  discount_percent decimal(5,2) NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_member_product_discounts_user ON member_product_discounts(user_id);
COMMENT ON TABLE member_product_discounts IS 'Admin atadığı üye-ürün bazlı indirim oranları (yüzde).';

ALTER TABLE member_product_discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own member_product_discounts" ON member_product_discounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role and admin manage member_product_discounts" ON member_product_discounts FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role' OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);
