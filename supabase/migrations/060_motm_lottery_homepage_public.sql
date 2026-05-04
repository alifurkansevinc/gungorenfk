-- Çekiliş sonucunu ana sayfada gösterme + herkese açık okuma (yalnızca yayınlanan etkinlik)
-- Aynı anda yalnızca bir etkinlik bandında olabilir.

ALTER TABLE motm_lottery_events
  ADD COLUMN IF NOT EXISTS show_on_homepage boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN motm_lottery_events.show_on_homepage IS 'true ise çekiliş tamamlanmış etkinlik ana sayfa bandında listelenir (aynı anda tek kayıt).';

ALTER TABLE motm_lottery_winners
  ADD COLUMN IF NOT EXISTS display_name text;

COMMENT ON COLUMN motm_lottery_winners.display_name IS 'Ana sayfa / kamu metni için çekiliş anında kopyalanan görünen ad.';

-- Aynı anda en fazla bir etkinlik bandında (kısmi benzersiz: yalnızca true satırları)
CREATE UNIQUE INDEX IF NOT EXISTS motm_lottery_events_one_homepage_banner
  ON motm_lottery_events (show_on_homepage)
  WHERE show_on_homepage = true;

CREATE POLICY "Public read published motm_lottery_events" ON motm_lottery_events
  FOR SELECT
  USING (show_on_homepage = true AND status = 'drawn');

CREATE POLICY "Public read draws for published lottery" ON motm_lottery_draws
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM motm_lottery_events e
      WHERE e.id = motm_lottery_draws.event_id
        AND e.show_on_homepage = true
        AND e.status = 'drawn'
    )
  );

CREATE POLICY "Public read winners for published lottery" ON motm_lottery_winners
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM motm_lottery_draws d
      JOIN motm_lottery_events e ON e.id = d.event_id
      WHERE d.id = motm_lottery_winners.draw_id
        AND e.show_on_homepage = true
        AND e.status = 'drawn'
    )
  );
