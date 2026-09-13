-- İş başvuru formu (admin ayarları + başvurular)

INSERT INTO site_settings (key, value) VALUES (
  'job_form',
  '{
    "is_active": true,
    "show_on_homepage": true,
    "title": "İş Başvurusu",
    "subtitle": "Kulübümüzde çalışmak ister misin?",
    "description": "Açık pozisyonlar için başvurunu buradan iletebilirsin. Yalnızca taraftar üyelerimiz başvuru yapabilir.",
    "positions": ["İdari personel", "Saha / tesis", "Medya & içerik", "Pazarlama", "Diğer"],
    "success_message": "Başvurun alındı. En kısa sürede seninle iletişime geçeceğiz."
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  birth_year smallint,
  city text,
  position_applied text NOT NULL,
  education text,
  experience text,
  message text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'hired')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_applications_created ON job_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_user ON job_applications(user_id);

COMMENT ON TABLE job_applications IS 'Taraftar üye iş başvuruları; yalnızca giriş yapanlar yazar.';

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own job_applications"
  ON job_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own job_applications"
  ON job_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin manage job_applications"
  ON job_applications FOR ALL
  USING (is_admin());

CREATE OR REPLACE FUNCTION set_job_applications_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS job_applications_updated_at ON job_applications;
CREATE TRIGGER job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW EXECUTE PROCEDURE set_job_applications_updated_at();
