-- Beden seçenekleri: S, M, L, XL, XXL, Tek Beden. Ürün bazında hangi bedenlerin olduğu store_products.sizes ile; sipariş kaleminde seçilen beden order_items.size ile.

ALTER TABLE store_products
  ADD COLUMN IF NOT EXISTS sizes text[] NOT NULL DEFAULT ARRAY['tek_beden'];
COMMENT ON COLUMN store_products.sizes IS 'Ürünün bedenleri: S, M, L, XL, XXL, tek_beden (en az biri)';

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS size text;
COMMENT ON COLUMN order_items.size IS 'Müşterinin seçtiği beden (S, M, L, XL, XXL, tek_beden)';
