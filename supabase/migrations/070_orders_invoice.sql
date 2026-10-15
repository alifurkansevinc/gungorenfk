-- Uyum e-Arşiv / e-Fatura sonucu. Kod not alanına da yazar; kolonlar panel sorgusu içindir.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS invoice_status text,
  ADD COLUMN IF NOT EXISTS invoice_number text,
  ADD COLUMN IF NOT EXISTS invoice_ettn text,
  ADD COLUMN IF NOT EXISTS invoice_scenario text,
  ADD COLUMN IF NOT EXISTS buyer_tax_id text;
