-- Bilet baremi: Sadece farklı maç sayısı sayılır (bir maça 1 bilet = 1 maç).
-- Mevcut match_tickets_count değerlerini farklı maç sayısına göre güncelle.
UPDATE fan_profiles fp
SET match_tickets_count = COALESCE(
  (SELECT COUNT(DISTINCT mt.match_id) FROM match_tickets mt WHERE mt.user_id = fp.user_id AND mt.payment_status = 'PAID'),
  0
);
