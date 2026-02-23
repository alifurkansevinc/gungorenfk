-- matches tablosu RLS: service_role veya admin_users üyesi insert/update/delete yapabilsin
-- (Bazı ortamlarda anon/session ile is_admin() yetmeyebilir; service_role açıkça eklenir)

DROP POLICY IF EXISTS "Admin manage matches" ON matches;

CREATE POLICY "Admin manage matches" ON matches FOR ALL USING (
  auth.jwt() ->> 'role' = 'service_role'
  OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);
