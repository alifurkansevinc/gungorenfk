-- Optaport varsayılanı "Süper Lig" olan lig maçları. Skor, tarih ve kadroya dokunulmaz.
UPDATE matches
SET competition = 'Süper Amatör Lig',
    updated_at = now()
WHERE btrim(competition) = 'Süper Lig';
