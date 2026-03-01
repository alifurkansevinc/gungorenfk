-- Yönetim kurulu: Görev açıklama (alt başlık), serbest görev ismi, biyografi. Görev (role_slug) artık zorunlu değil.

ALTER TABLE board_members
  ADD COLUMN IF NOT EXISTS role_description text,
  ADD COLUMN IF NOT EXISTS role_custom text,
  ADD COLUMN IF NOT EXISTS biography text;

ALTER TABLE board_members ALTER COLUMN role_slug DROP NOT NULL;

COMMENT ON COLUMN board_members.role_description IS 'Görev açıklaması / alt başlık (örn. alt görev)';
COMMENT ON COLUMN board_members.role_custom IS 'Serbest görev ismi; role_slug seçilmediğinde admin tarafından yazılır';
COMMENT ON COLUMN board_members.biography IS 'Biyografi; girilirse sitede gösterilir';
