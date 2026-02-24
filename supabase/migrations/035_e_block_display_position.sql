-- E blok: Resimdeki düzene göre sütun pozisyonları
-- E18: Sol 1-6, Orta 7-11, boşluk, Sağ 12-15 -> sütun 13-16
-- E4-E1: Alt bölüm basamaklı (her sıra bir öncekinden 5 sütun sağda başlar)

-- E18: E18-12,13,14,15 -> sütun 13,14,15,16 (orta-sağ arası boşluk)
UPDATE stadium_seats SET seat_in_row = 13 WHERE section = 'E' AND row_number = 18 AND seat_code = 'E-18-12';
UPDATE stadium_seats SET seat_in_row = 14 WHERE section = 'E' AND row_number = 18 AND seat_code = 'E-18-13';
UPDATE stadium_seats SET seat_in_row = 15 WHERE section = 'E' AND row_number = 18 AND seat_code = 'E-18-14';
UPDATE stadium_seats SET seat_in_row = 16 WHERE section = 'E' AND row_number = 18 AND seat_code = 'E-18-15';

-- E4: 20 koltuk sütun 6-25 (solda 5 boşluk)
UPDATE stadium_seats SET seat_in_row = 6  WHERE section = 'E' AND row_number = 4 AND seat_code = 'E-4-1';
UPDATE stadium_seats SET seat_in_row = 7  WHERE section = 'E' AND row_number = 4 AND seat_code = 'E-4-2';
UPDATE stadium_seats SET seat_in_row = 8  WHERE section = 'E' AND row_number = 4 AND seat_code = 'E-4-3';
UPDATE stadium_seats SET seat_in_row = 9  WHERE section = 'E' AND row_number = 4 AND seat_code = 'E-4-4';
UPDATE stadium_seats SET seat_in_row = 10 WHERE section = 'E' AND row_number = 4 AND seat_code = 'E-4-5';
UPDATE stadium_seats SET seat_in_row = 11 WHERE section = 'E' AND row_number = 4 AND seat_code = 'E-4-6';
UPDATE stadium_seats SET seat_in_row = 12 WHERE section = 'E' AND row_number = 4 AND seat_code = 'E-4-7';
UPDATE stadium_seats SET seat_in_row = 13 WHERE section = 'E' AND row_number = 4 AND seat_code = 'E-4-8';
UPDATE stadium_seats SET seat_in_row = 14 WHERE section = 'E' AND row_number = 4 AND seat_code = 'E-4-9';
UPDATE stadium_seats SET seat_in_row = 15 WHERE section = 'E' AND row_number = 4 AND seat_code = 'E-4-10';
UPDATE stadium_seats SET seat_in_row = 16 WHERE section = 'E' AND row_number = 4 AND seat_code = 'E-4-11';
UPDATE stadium_seats SET seat_in_row = 17 WHERE section = 'E' AND row_number = 4 AND seat_code = 'E-4-12';
UPDATE stadium_seats SET seat_in_row = 18 WHERE section = 'E' AND row_number = 4 AND seat_code = 'E-4-13';
UPDATE stadium_seats SET seat_in_row = 19 WHERE section = 'E' AND row_number = 4 AND seat_code = 'E-4-14';
UPDATE stadium_seats SET seat_in_row = 20 WHERE section = 'E' AND row_number = 4 AND seat_code = 'E-4-15';
UPDATE stadium_seats SET seat_in_row = 21 WHERE section = 'E' AND row_number = 4 AND seat_code = 'E-4-16';
UPDATE stadium_seats SET seat_in_row = 22 WHERE section = 'E' AND row_number = 4 AND seat_code = 'E-4-17';
UPDATE stadium_seats SET seat_in_row = 23 WHERE section = 'E' AND row_number = 4 AND seat_code = 'E-4-18';
UPDATE stadium_seats SET seat_in_row = 24 WHERE section = 'E' AND row_number = 4 AND seat_code = 'E-4-19';
UPDATE stadium_seats SET seat_in_row = 25 WHERE section = 'E' AND row_number = 4 AND seat_code = 'E-4-20';

-- E3: 20 koltuk sütun 11-30 (solda 10 boşluk)
UPDATE stadium_seats SET seat_in_row = 11 WHERE section = 'E' AND row_number = 3 AND seat_code = 'E-3-1';
UPDATE stadium_seats SET seat_in_row = 12 WHERE section = 'E' AND row_number = 3 AND seat_code = 'E-3-2';
UPDATE stadium_seats SET seat_in_row = 13 WHERE section = 'E' AND row_number = 3 AND seat_code = 'E-3-3';
UPDATE stadium_seats SET seat_in_row = 14 WHERE section = 'E' AND row_number = 3 AND seat_code = 'E-3-4';
UPDATE stadium_seats SET seat_in_row = 15 WHERE section = 'E' AND row_number = 3 AND seat_code = 'E-3-5';
UPDATE stadium_seats SET seat_in_row = 16 WHERE section = 'E' AND row_number = 3 AND seat_code = 'E-3-6';
UPDATE stadium_seats SET seat_in_row = 17 WHERE section = 'E' AND row_number = 3 AND seat_code = 'E-3-7';
UPDATE stadium_seats SET seat_in_row = 18 WHERE section = 'E' AND row_number = 3 AND seat_code = 'E-3-8';
UPDATE stadium_seats SET seat_in_row = 19 WHERE section = 'E' AND row_number = 3 AND seat_code = 'E-3-9';
UPDATE stadium_seats SET seat_in_row = 20 WHERE section = 'E' AND row_number = 3 AND seat_code = 'E-3-10';
UPDATE stadium_seats SET seat_in_row = 21 WHERE section = 'E' AND row_number = 3 AND seat_code = 'E-3-11';
UPDATE stadium_seats SET seat_in_row = 22 WHERE section = 'E' AND row_number = 3 AND seat_code = 'E-3-12';
UPDATE stadium_seats SET seat_in_row = 23 WHERE section = 'E' AND row_number = 3 AND seat_code = 'E-3-13';
UPDATE stadium_seats SET seat_in_row = 24 WHERE section = 'E' AND row_number = 3 AND seat_code = 'E-3-14';
UPDATE stadium_seats SET seat_in_row = 25 WHERE section = 'E' AND row_number = 3 AND seat_code = 'E-3-15';
UPDATE stadium_seats SET seat_in_row = 26 WHERE section = 'E' AND row_number = 3 AND seat_code = 'E-3-16';
UPDATE stadium_seats SET seat_in_row = 27 WHERE section = 'E' AND row_number = 3 AND seat_code = 'E-3-17';
UPDATE stadium_seats SET seat_in_row = 28 WHERE section = 'E' AND row_number = 3 AND seat_code = 'E-3-18';
UPDATE stadium_seats SET seat_in_row = 29 WHERE section = 'E' AND row_number = 3 AND seat_code = 'E-3-19';
UPDATE stadium_seats SET seat_in_row = 30 WHERE section = 'E' AND row_number = 3 AND seat_code = 'E-3-20';

-- E2: 20 koltuk sütun 16-35 (solda 15 boşluk)
UPDATE stadium_seats SET seat_in_row = 16 WHERE section = 'E' AND row_number = 2 AND seat_code = 'E-2-1';
UPDATE stadium_seats SET seat_in_row = 17 WHERE section = 'E' AND row_number = 2 AND seat_code = 'E-2-2';
UPDATE stadium_seats SET seat_in_row = 18 WHERE section = 'E' AND row_number = 2 AND seat_code = 'E-2-3';
UPDATE stadium_seats SET seat_in_row = 19 WHERE section = 'E' AND row_number = 2 AND seat_code = 'E-2-4';
UPDATE stadium_seats SET seat_in_row = 20 WHERE section = 'E' AND row_number = 2 AND seat_code = 'E-2-5';
UPDATE stadium_seats SET seat_in_row = 21 WHERE section = 'E' AND row_number = 2 AND seat_code = 'E-2-6';
UPDATE stadium_seats SET seat_in_row = 22 WHERE section = 'E' AND row_number = 2 AND seat_code = 'E-2-7';
UPDATE stadium_seats SET seat_in_row = 23 WHERE section = 'E' AND row_number = 2 AND seat_code = 'E-2-8';
UPDATE stadium_seats SET seat_in_row = 24 WHERE section = 'E' AND row_number = 2 AND seat_code = 'E-2-9';
UPDATE stadium_seats SET seat_in_row = 25 WHERE section = 'E' AND row_number = 2 AND seat_code = 'E-2-10';
UPDATE stadium_seats SET seat_in_row = 26 WHERE section = 'E' AND row_number = 2 AND seat_code = 'E-2-11';
UPDATE stadium_seats SET seat_in_row = 27 WHERE section = 'E' AND row_number = 2 AND seat_code = 'E-2-12';
UPDATE stadium_seats SET seat_in_row = 28 WHERE section = 'E' AND row_number = 2 AND seat_code = 'E-2-13';
UPDATE stadium_seats SET seat_in_row = 29 WHERE section = 'E' AND row_number = 2 AND seat_code = 'E-2-14';
UPDATE stadium_seats SET seat_in_row = 30 WHERE section = 'E' AND row_number = 2 AND seat_code = 'E-2-15';
UPDATE stadium_seats SET seat_in_row = 31 WHERE section = 'E' AND row_number = 2 AND seat_code = 'E-2-16';
UPDATE stadium_seats SET seat_in_row = 32 WHERE section = 'E' AND row_number = 2 AND seat_code = 'E-2-17';
UPDATE stadium_seats SET seat_in_row = 33 WHERE section = 'E' AND row_number = 2 AND seat_code = 'E-2-18';
UPDATE stadium_seats SET seat_in_row = 34 WHERE section = 'E' AND row_number = 2 AND seat_code = 'E-2-19';
UPDATE stadium_seats SET seat_in_row = 35 WHERE section = 'E' AND row_number = 2 AND seat_code = 'E-2-20';

-- E1: 20 koltuk sütun 21-40 (solda 20 boşluk)
UPDATE stadium_seats SET seat_in_row = 21 WHERE section = 'E' AND row_number = 1 AND seat_code = 'E-1-1';
UPDATE stadium_seats SET seat_in_row = 22 WHERE section = 'E' AND row_number = 1 AND seat_code = 'E-1-2';
UPDATE stadium_seats SET seat_in_row = 23 WHERE section = 'E' AND row_number = 1 AND seat_code = 'E-1-3';
UPDATE stadium_seats SET seat_in_row = 24 WHERE section = 'E' AND row_number = 1 AND seat_code = 'E-1-4';
UPDATE stadium_seats SET seat_in_row = 25 WHERE section = 'E' AND row_number = 1 AND seat_code = 'E-1-5';
UPDATE stadium_seats SET seat_in_row = 26 WHERE section = 'E' AND row_number = 1 AND seat_code = 'E-1-6';
UPDATE stadium_seats SET seat_in_row = 27 WHERE section = 'E' AND row_number = 1 AND seat_code = 'E-1-7';
UPDATE stadium_seats SET seat_in_row = 28 WHERE section = 'E' AND row_number = 1 AND seat_code = 'E-1-8';
UPDATE stadium_seats SET seat_in_row = 29 WHERE section = 'E' AND row_number = 1 AND seat_code = 'E-1-9';
UPDATE stadium_seats SET seat_in_row = 30 WHERE section = 'E' AND row_number = 1 AND seat_code = 'E-1-10';
UPDATE stadium_seats SET seat_in_row = 31 WHERE section = 'E' AND row_number = 1 AND seat_code = 'E-1-11';
UPDATE stadium_seats SET seat_in_row = 32 WHERE section = 'E' AND row_number = 1 AND seat_code = 'E-1-12';
UPDATE stadium_seats SET seat_in_row = 33 WHERE section = 'E' AND row_number = 1 AND seat_code = 'E-1-13';
UPDATE stadium_seats SET seat_in_row = 34 WHERE section = 'E' AND row_number = 1 AND seat_code = 'E-1-14';
UPDATE stadium_seats SET seat_in_row = 35 WHERE section = 'E' AND row_number = 1 AND seat_code = 'E-1-15';
UPDATE stadium_seats SET seat_in_row = 36 WHERE section = 'E' AND row_number = 1 AND seat_code = 'E-1-16';
UPDATE stadium_seats SET seat_in_row = 37 WHERE section = 'E' AND row_number = 1 AND seat_code = 'E-1-17';
UPDATE stadium_seats SET seat_in_row = 38 WHERE section = 'E' AND row_number = 1 AND seat_code = 'E-1-18';
UPDATE stadium_seats SET seat_in_row = 39 WHERE section = 'E' AND row_number = 1 AND seat_code = 'E-1-19';
UPDATE stadium_seats SET seat_in_row = 40 WHERE section = 'E' AND row_number = 1 AND seat_code = 'E-1-20';
