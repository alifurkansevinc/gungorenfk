-- Bağış: makbuz numarası, bağışçı tipi (bireysel/şirket), ünvan, adres
ALTER TABLE donations ADD COLUMN IF NOT EXISTS receipt_number text;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS donor_type text DEFAULT 'bireysel';
ALTER TABLE donations ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE donations ADD COLUMN IF NOT EXISTS address text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_donations_receipt_number ON donations(receipt_number) WHERE receipt_number IS NOT NULL;

-- Admin tarafında düzenlenebilir bağış makbuzu metni (site_settings)
INSERT INTO site_settings (key, value) VALUES (
  'donation_receipt_template',
  '{"title": "Bağış Makbuzu", "body": "Bu makbuz, Güngören Belediye Spor Kulübü''ne yapılan bağışı belgelemektedir.\n\nBağışçıya ve kulübümüze verdiği destek için teşekkür ederiz."}'::jsonb
) ON CONFLICT (key) DO NOTHING;
