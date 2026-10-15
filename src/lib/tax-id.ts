/** 11 haneli TCKN checksum. 10 haneli VKN biçim olarak kabul edilir. */
export function isValidBuyerTaxId(raw: string): boolean {
  const v = raw.replace(/\D/g, "");
  if (v.length === 10) return true;
  if (v.length !== 11 || v[0] === "0") return false;
  const d = v.split("").map(Number);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  const tenth = ((odd * 7 - even) % 10 + 10) % 10;
  if (tenth !== d[9]) return false;
  const eleventh = d.slice(0, 10).reduce((sum, n) => sum + n, 0) % 10;
  return eleventh === d[10];
}
