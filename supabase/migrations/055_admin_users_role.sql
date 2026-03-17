-- admin_users tablosu yoksa oluştur (001 çalışmamışsa), varsa role sütunu ekle
-- admin: tüm yetkiler
-- operator: Operatör
-- club_manager: Kulüp Müdürü
-- football_director: Futbol Direktörü
-- event_coordinator: Etkinlik Sorumlusu

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_users') THEN
    CREATE TABLE admin_users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'operator', 'club_manager', 'football_director', 'event_coordinator'))
    );
    ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Admin read admin_users" ON admin_users FOR SELECT USING (
      EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid())
    );
    CREATE POLICY "Admin insert admin_users" ON admin_users FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid())
    );
    CREATE POLICY "Users read own admin status" ON admin_users FOR SELECT USING (auth.uid() = user_id);
    COMMENT ON TABLE admin_users IS 'Admin panel erişimi; role ile yetki kısıtı';
  ELSE
    ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'admin';
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'admin_users_role_check'
    ) THEN
      ALTER TABLE admin_users
        ADD CONSTRAINT admin_users_role_check
        CHECK (role IN ('admin', 'operator', 'club_manager', 'football_director', 'event_coordinator'));
    END IF;
  END IF;
END $$;

COMMENT ON COLUMN admin_users.role IS 'admin | operator | club_manager | football_director | event_coordinator';
