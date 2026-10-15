-- İade ve beden değişimi talepleri.
-- Teslim (delivered_at) tarihinden itibaren 14 gün, uygulama katmanında kontrol edilir.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

COMMENT ON COLUMN orders.delivered_at IS 'Sipariş ilk kez DELIVERED olduğunda set edilir. İade penceresi bu tarihten yürür.';

UPDATE orders
SET delivered_at = updated_at
WHERE status = 'DELIVERED' AND delivered_at IS NULL;

CREATE OR REPLACE FUNCTION orders_set_delivered_at()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'DELIVERED'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'DELIVERED')
     AND NEW.delivered_at IS NULL THEN
    NEW.delivered_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_set_delivered_at ON orders;
CREATE TRIGGER orders_set_delivered_at
  BEFORE INSERT OR UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE PROCEDURE orders_set_delivered_at();

CREATE TABLE IF NOT EXISTS order_service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  request_type text NOT NULL CHECK (request_type IN ('RETURN', 'SIZE_EXCHANGE')),
  status text NOT NULL DEFAULT 'TALEP' CHECK (status IN ('TALEP', 'ONAYLANDI', 'TESLIM_ALINDI', 'TAMAMLANDI', 'REDDEDILDI', 'IPTAL')),
  quantity int NOT NULL CHECK (quantity >= 1),
  from_size text,
  to_size text,
  reason text,
  admin_note text,
  refund_amount numeric(12,2),
  refund_host_reference text,
  stock_reserved boolean NOT NULL DEFAULT false,
  old_stock_restored boolean NOT NULL DEFAULT false,
  spend_reversed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  CONSTRAINT order_service_requests_size_shape CHECK (
    (request_type = 'RETURN' AND to_size IS NULL)
    OR (request_type = 'SIZE_EXCHANGE' AND to_size IS NOT NULL)
  )
);

COMMENT ON TABLE order_service_requests IS 'Taraftar iade ve beden değişimi talepleri. Para iadesi yalnızca RETURN tamamlanınca yapılır.';

CREATE UNIQUE INDEX IF NOT EXISTS order_service_requests_one_open_per_item
  ON order_service_requests (order_item_id)
  WHERE status IN ('TALEP', 'ONAYLANDI', 'TESLIM_ALINDI');

CREATE INDEX IF NOT EXISTS idx_order_service_requests_order ON order_service_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_order_service_requests_status_created ON order_service_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_service_requests_user ON order_service_requests(user_id);

CREATE OR REPLACE FUNCTION set_order_service_requests_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS order_service_requests_updated_at ON order_service_requests;
CREATE TRIGGER order_service_requests_updated_at
  BEFORE UPDATE ON order_service_requests
  FOR EACH ROW
  EXECUTE PROCEDURE set_order_service_requests_updated_at();

ALTER TABLE order_service_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own service requests" ON order_service_requests;
CREATE POLICY "Users read own service requests"
  ON order_service_requests FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_service_requests.order_id
        AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users read guest order service requests" ON order_service_requests;
CREATE POLICY "Users read guest order service requests"
  ON order_service_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM orders o
      JOIN fan_profiles fp ON fp.user_id = auth.uid()
      WHERE o.id = order_service_requests.order_id
        AND o.user_id IS NULL
        AND o.guest_email IS NOT NULL
        AND o.guest_email = fp.email
    )
  );

DROP POLICY IF EXISTS "Admin manage service requests" ON order_service_requests;
CREATE POLICY "Admin manage service requests"
  ON order_service_requests FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Beden stoğunu satır kilidiyle değiştirir. Yetersiz stokta hata verir.
CREATE OR REPLACE FUNCTION adjust_product_size_stock(
  p_product_id uuid,
  p_size text,
  p_delta integer
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stock integer;
  next_stock integer;
  size_key text;
BEGIN
  size_key := btrim(COALESCE(p_size, ''));
  IF size_key = '' THEN
    RAISE EXCEPTION 'Beden gerekli';
  END IF;
  IF p_delta = 0 THEN
    RAISE EXCEPTION 'Stok değişimi 0 olamaz';
  END IF;

  SELECT COALESCE((stock_by_size ->> size_key)::integer, 0)
  INTO current_stock
  FROM store_products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ürün bulunamadı';
  END IF;

  next_stock := current_stock + p_delta;
  IF next_stock < 0 THEN
    RAISE EXCEPTION 'Yetersiz stok';
  END IF;

  UPDATE store_products
  SET stock_by_size = jsonb_set(COALESCE(stock_by_size, '{}'::jsonb), ARRAY[size_key], to_jsonb(next_stock), true),
      updated_at = now()
  WHERE id = p_product_id;

  RETURN next_stock;
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_product_size_stock(uuid, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.adjust_product_size_stock(uuid, text, integer) TO service_role;
