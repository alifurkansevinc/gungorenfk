-- Sipariş kalemi ek seçenekleri (ör. forma isim-numara yazdırma)
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS options jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN order_items.options IS 'JSON: { "namePrint": { "fullName": "...", "number": "..." } } gibi ek bilgiler';
