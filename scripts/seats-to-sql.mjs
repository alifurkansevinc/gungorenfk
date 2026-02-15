import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const seats = JSON.parse(readFileSync(join(__dirname, "stadium-seats.json"), "utf8"));

const values = seats
  .map((s, i) => `('${s.seat_code.replace(/'/g, "''")}', '${s.section}', ${s.row_number}, ${s.seat_in_row}, ${s.global_number})`)
  .join(",\n");

const sql = `-- Stadyum koltukları (Excel stadyum durum.xlsx'ten üretildi)
INSERT INTO stadium_seats (seat_code, section, row_number, seat_in_row, sort_order)
VALUES\n${values}\nON CONFLICT (seat_code) DO NOTHING;
`;

writeFileSync(join(__dirname, "..", "supabase", "migrations", "019_stadium_seats_seed.sql"), sql);
console.log("Wrote 019_stadium_seats_seed.sql with", seats.length, "seats.");
