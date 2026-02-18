-- Transfer yönü: gelen (bize gelen) / giden (bizden giden)
ALTER TABLE transfers
  ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'incoming';

ALTER TABLE transfers
  DROP CONSTRAINT IF EXISTS transfers_direction_check;
ALTER TABLE transfers
  ADD CONSTRAINT transfers_direction_check CHECK (direction IN ('incoming', 'outgoing'));

COMMENT ON COLUMN transfers.direction IS 'incoming: kadromuza gelen, outgoing: bizden giden';