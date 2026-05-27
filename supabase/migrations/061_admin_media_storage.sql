-- Admin panel görsel yüklemeleri (kadro, yönetim, mağaza, transfer vb.)
-- Yükleme yalnızca sunucu API (service role) üzerinden; bucket herkese okunur (site görselleri).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'admin-media',
  'admin-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read admin-media objects" ON storage.objects;
CREATE POLICY "Public read admin-media objects"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'admin-media');
