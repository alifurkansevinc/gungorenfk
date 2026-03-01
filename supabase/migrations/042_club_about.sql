-- Kulüp sayfası "Hakkımızda" metni (admin'den düzenlenebilir, tek satır)

CREATE TABLE club_about (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO club_about (id, content) VALUES (1,
  'Güngören Belediye Spor Kulübü, İstanbul Güngören ilçesinin resmi futbol takımıdır. Bölgesel Amatör Lig ve alt kategorilerde mücadele eden kulübümüz, bölge sporuna ve taraftar ailesine güç katmak için çalışmaktadır.

Kulüp olarak amacımız; genç yeteneklere fırsat sunmak, taraftarımızla birlikte büyümek ve Güngören''i Türk futbolunda temsil etmektir.'
);

COMMENT ON TABLE club_about IS 'Kulübümüz sayfası Hakkımızda metni; admin panelinden düzenlenir';

ALTER TABLE club_about ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read club_about" ON club_about FOR SELECT USING (true);
CREATE POLICY "Admin manage club_about" ON club_about FOR ALL USING (is_admin());
