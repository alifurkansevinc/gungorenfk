-- Ürün stok kodu (SKU) ve birden fazla görsel

-- store_products: sku alanı (mevcut satırlar için slug kullanılır)
ALTER TABLE store_products
  ADD COLUMN IF NOT EXISTS sku text;

UPDATE store_products SET sku = slug WHERE sku IS NULL;
ALTER TABLE store_products ALTER COLUMN sku SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_store_products_sku ON store_products(sku);

-- Ürün görselleri (çoklu)
CREATE TABLE IF NOT EXISTS store_product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES store_products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_product_images_product ON store_product_images(product_id);

ALTER TABLE store_product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read store_product_images" ON store_product_images FOR SELECT USING (true);
CREATE POLICY "Admin manage store_product_images" ON store_product_images FOR ALL USING (is_admin());

COMMENT ON COLUMN store_products.sku IS 'Ürün stok kodu; benzersiz ve zorunlu';
