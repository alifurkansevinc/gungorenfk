/**
 * Excel'den alınan grid (read-stadyum-xlsx.mjs çıktısı) ile koltuk listesi üretir.
 * x = koltuk, boş sütun = koridor. Bölümler koridorlarla ayrılır (A, B, C, D, E).
 * Koltuk kodu: BÖLÜM-SIRA-KOLTUK (örn. A-1-15)
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import * as XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, "..", "docs", "stadyum durum.xlsx");

const buf = readFileSync(filePath);
const wb = XLSX.read(buf, { type: "buffer", cellDates: false });
const sheet = wb.Sheets[wb.SheetNames[0]];
const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");

const rows = [];
for (let R = range.s.r; R <= range.e.r; R++) {
  const row = [];
  for (let C = range.s.c; C <= range.e.c; C++) {
    const addr = XLSX.utils.encode_cell({ r: R, c: C });
    const cell = sheet[addr];
    const val = cell ? (cell.v != null ? String(cell.v).trim().toUpperCase() : "") : "";
    row.push(val === "X" ? "x" : val ? val : "");
  }
  rows.push(row);
}

const SECTION_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const seats = [];
let globalSeatNumber = 0;

for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
  const row = rows[rowIndex];
  let sectionIndex = 0;
  let seatInSection = 0;
  let inGap = true;

  for (let colIndex = 0; colIndex < row.length; colIndex++) {
    const cell = row[colIndex];
    if (cell === "x") {
      if (inGap) {
        sectionIndex++;
        seatInSection = 0;
        inGap = false;
      }
      seatInSection++;
      globalSeatNumber++;
      const sectionLetter = SECTION_LETTERS[sectionIndex - 1] || String(sectionIndex);
      const rowNum = rowIndex + 1;
      const seatCode = `${sectionLetter}-${rowNum}-${seatInSection}`;
      seats.push({
        global_number: globalSeatNumber,
        seat_code: seatCode,
        section: sectionLetter,
        row_number: rowNum,
        seat_in_row: seatInSection,
        grid_row: rowIndex,
        grid_col: colIndex,
      });
    } else {
      inGap = true;
    }
  }
}

console.log(JSON.stringify(seats, null, 2));
console.error(`Toplam koltuk: ${seats.length}`);
