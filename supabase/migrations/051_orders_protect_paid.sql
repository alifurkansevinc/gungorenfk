-- Ödendi (PAID) statüsündeki siparişler silinemez (admin dahil).
CREATE OR REPLACE FUNCTION prevent_delete_paid_order()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.payment_status = 'PAID' THEN
    RAISE EXCEPTION 'Ödendi statüsündeki sipariş silinemez.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_delete_paid_order ON orders;
CREATE TRIGGER trg_prevent_delete_paid_order
  BEFORE DELETE ON orders
  FOR EACH ROW
  EXECUTE PROCEDURE prevent_delete_paid_order();
