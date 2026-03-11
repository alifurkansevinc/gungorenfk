-- Ödendi (PAID) statüsündeki bağışlar silinemez (admin dahil).
CREATE OR REPLACE FUNCTION prevent_delete_paid_donation()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.payment_status = 'PAID' THEN
    RAISE EXCEPTION 'Ödendi statüsündeki bağış silinemez.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_delete_paid_donation ON donations;
CREATE TRIGGER trg_prevent_delete_paid_donation
  BEFORE DELETE ON donations
  FOR EACH ROW
  EXECUTE PROCEDURE prevent_delete_paid_donation();
