import * as XLSX from "xlsx";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, "..", "docs", "stadyum durum.xlsx");

const buf = readFileSync(filePath);
const wb = XLSX.read(buf, { type: "buffer", cellDates: false });
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
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

console.log(JSON.stringify(rows, null, 0));
