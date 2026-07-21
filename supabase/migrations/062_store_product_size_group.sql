-- Ürün başına tek beden takımı (harf, boy, yas, isim, tek).

ALTER TABLE store_products
  ADD COLUMN IF NOT EXISTS size_group text NOT NULL DEFAULT 'harf';

COMMENT ON COLUMN store_products.size_group IS 'Beden takımı: harf (S-XXL), boy (140-176), yas (7-8..15-16), isim (kucuk/orta/buyuk), tek (tek_beden)';

-- Mevcut ürünler: sizes dizisine göre grup tahmini
UPDATE store_products
SET size_group = CASE
  WHEN sizes = ARRAY['tek_beden']::text[] OR (array_length(sizes, 1) = 1 AND sizes[1] = 'tek_beden') THEN 'tek'
  WHEN sizes <@ ARRAY['S','M','L','XL','XXL']::text[] THEN 'harf'
  WHEN sizes <@ ARRAY['140','152','164','176','XS']::text[] THEN 'boy'
  WHEN sizes <@ ARRAY['7-8','9-10','11-12','13-14','15-16']::text[] THEN 'yas'
  WHEN sizes <@ ARRAY['kucuk_boy','orta_boy','buyuk_boy']::text[] THEN 'isim'
  ELSE 'harf'
END
WHERE size_group = 'harf';
