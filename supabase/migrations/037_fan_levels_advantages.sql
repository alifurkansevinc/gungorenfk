-- Her rütbenin (rozet kademesinin) avantajları admin panelinden düzenlenebilir; Benim Köşem'de sonraki rütbenin avantajları madde madde gösterilir.
-- Her satır bir madde (textarea'da satır sonu ile ayrılır).

ALTER TABLE fan_levels ADD COLUMN IF NOT EXISTS advantages text;

COMMENT ON COLUMN fan_levels.advantages IS 'Bu rütbede kazanılan avantajlar, her satır bir madde (Benim Köşem’de madde işaretli listelenir)';
