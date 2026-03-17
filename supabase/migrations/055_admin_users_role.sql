-- admin_users tablosuna role sütunu ekle
-- admin: tüm yetkiler
-- operator: Operatör
-- club_manager: Kulüp Müdürü
-- football_director: Futbol Direktörü
-- event_coordinator: Etkinlik Sorumlusu

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'admin';

ALTER TABLE admin_users
  ADD CONSTRAINT admin_users_role_check
  CHECK (role IN ('admin', 'operator', 'club_manager', 'football_director', 'event_coordinator'));

COMMENT ON COLUMN admin_users.role IS 'admin | operator | club_manager | football_director | event_coordinator';
