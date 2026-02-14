-- Etkinlik alanları: news tablosunu etkinlik bilgileriyle genişlet
ALTER TABLE news ADD COLUMN IF NOT EXISTS event_date date;
ALTER TABLE news ADD COLUMN IF NOT EXISTS event_time text;
ALTER TABLE news ADD COLUMN IF NOT EXISTS event_place text;
ALTER TABLE news ADD COLUMN IF NOT EXISTS event_type text;
ALTER TABLE news ADD COLUMN IF NOT EXISTS capacity int;
ALTER TABLE news ADD COLUMN IF NOT EXISTS registration_url text;
ALTER TABLE news ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false;
ALTER TABLE news ADD COLUMN IF NOT EXISTS external_link text;
ALTER TABLE news ADD COLUMN IF NOT EXISTS event_end_date date;
