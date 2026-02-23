-- İlk admin ekleme: admin_users boşken tek seferlik kullanılır.
-- Kullanım (Supabase SQL Editor): SELECT add_first_admin('BURAYA-AUTH-USERS-UUID-YAPIŞTIR');

CREATE OR REPLACE FUNCTION add_first_admin(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM admin_users LIMIT 1) THEN
    RETURN 'Zaten en az bir admin var. Yeni admin eklemek için admin panelinden e-posta ile ekleyin.';
  END IF;
  IF p_user_id IS NULL THEN
    RETURN 'Geçersiz user_id.';
  END IF;
  INSERT INTO admin_users (user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN 'İlk admin eklendi. Bu e-posta/şifre ile /admin/giris sayfasından giriş yapabilirsiniz.';
END;
$$;

COMMENT ON FUNCTION add_first_admin(uuid) IS 'Sadece admin_users boşken çalışır. Supabase Auth kullanıcısının UUID''si ile ilk admin eklenir.';
