  -- Makbuz / teslim bilgisi sayfalarına güvenli erişim için tek seferlik token.
  -- Yeni siparişlerde set edilir; eski siparişlerde null kalır (sadece sahip session ile erişilebilir).
  ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS receipt_token uuid UNIQUE;
  COMMENT ON COLUMN orders.receipt_token IS 'Makbuz ve teslim bilgisi sayfalarına erişim için güvenli token. URL ile paylaşılır.';
