-- Mağazadan teslim: teslimat yöntemi, teslim tarihi, QR teslim kodu

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_method text NOT NULL DEFAULT 'shipping'
    CHECK (delivery_method IN ('shipping', 'store_pickup')),
  ADD COLUMN IF NOT EXISTS pickup_date date,
  ADD COLUMN IF NOT EXISTS pickup_code text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_pickup_code ON orders(pickup_code) WHERE pickup_code IS NOT NULL;

COMMENT ON COLUMN orders.delivery_method IS 'shipping = kargo, store_pickup = Güngören Store''dan teslim';
COMMENT ON COLUMN orders.pickup_date IS 'Mağazadan teslim için verilen gün (sipariş + 3 iş günü)';
COMMENT ON COLUMN orders.pickup_code IS 'QR ile gösterilen benzersiz kod; admin okutunca sipariş tamamlanır';
