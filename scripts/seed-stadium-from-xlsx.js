#!/usr/bin/env node
/**
 * statoturma.xlsx dosyasından tüm blokları (A, B, C, D, E) okuyup
 * stadium_seats için SQL üretir. Çıktı: supabase/migrations/028_stadium_seats_statoturma.sql
 * (İlk çalıştırmada migration oluşturuldu; Excel değişirse bu script'i tekrar çalıştırıp
 *  yeni bir migration dosyası oluşturabilir veya 028'i güncelleyebilirsiniz.)
 */

const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const xlsxPath = path.join(__dirname, "..", "statoturma.xlsx");
const outPath = path.join(__dirname, "..", "supabase", "migrations", "028_stadium_seats_statoturma.sql");

const seatRegex = /^([A-E])(\d+)-(\d+)$/i;
const seats = [];
let sortOrder = 0;

const wb = XLSX.readFile(xlsxPath);
wb.SheetNames.forEach((sheetName) => {
  const sh = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sh, { header: 1 });
  for (let r = 0; r < data.length; r++) {
    const row = data[r];
    if (!Array.isArray(row)) continue;
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (cell == null || typeof cell !== "string") continue;
      const m = cell.trim().match(seatRegex);
      if (!m) continue;
      const section = m[1].toUpperCase();
      const rowNum = parseInt(m[2], 10);
      const seatInRow = parseInt(m[3], 10);
      const seatCode = `${section}-${rowNum}-${seatInRow}`;
      seats.push({
        seat_code: seatCode,
        section,
        row_number: rowNum,
        seat_in_row: seatInRow,
        sort_order: ++sortOrder,
      });
    }
  }
});

const byCode = {};
seats.forEach((s) => {
  byCode[s.seat_code] = s;
});
const unique = Object.values(byCode).sort((a, b) => a.sort_order - b.sort_order);
unique.forEach((s, i) => {
  s.sort_order = i + 1;
});

const values = unique.map(
  (s) =>
    `('${s.seat_code.replace(/'/g, "''")}', '${s.section}', ${s.row_number}, ${s.seat_in_row}, ${s.sort_order})`
);

const lines = [
  "-- Stadyum koltukları: statoturma.xlsx bloklarından (A, B, C, D, E)",
  "-- Bilet numaralandırması bu plana göre.",
  "INSERT INTO stadium_seats (seat_code, section, row_number, seat_in_row, sort_order)",
  "VALUES",
  values.join(",\n"),
  "ON CONFLICT (seat_code) DO UPDATE SET",
  "  section = EXCLUDED.section,",
  "  row_number = EXCLUDED.row_number,",
  "  seat_in_row = EXCLUDED.seat_in_row,",
  "  sort_order = EXCLUDED.sort_order;",
];

fs.writeFileSync(outPath, lines.join("\n"));
console.log(`Wrote ${unique.length} seats to ${path.relative(process.cwd(), outPath)}`);
