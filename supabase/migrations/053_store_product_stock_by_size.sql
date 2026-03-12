-- Beden bazlı stok: her beden için ayrı adet. Satış sonrası otomatik düşer.
-- stock_by_size: { "S": 10, "M": 5, "L": 0, "tek_beden": 3 } gibi. Eksik key = 0 kabul edilir.

ALTER TABLE store_products
  ADD COLUMN IF NOT EXISTS stock_by_size jsonb NOT NULL DEFAULT '{}';
COMMENT ON COLUMN store_products.stock_by_size IS 'Beden bazlı stok: key = beden (S,M,L,XL,XXL,tek_beden), value = adet. Satışta otomatik düşer.';
