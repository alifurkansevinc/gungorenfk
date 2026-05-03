/** Mağaza: isminde "forma" geçen ürünlerde isim-numara yazdırma eki. */
export const FORMA_NAME_PRINT_ADDON_TRY = 100;

export function isFormaProductName(productName: string): boolean {
  return productName.toLocaleLowerCase("tr-TR").includes("forma");
}

/** Kelimeler: baş harf büyük, devamı küçük (Türkçe yerelleştirme). */
export function formatTurkishTitleCaseWords(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  return trimmed
    .split(" ")
    .map((word) => {
      if (!word) return word;
      const lower = word.toLocaleLowerCase("tr-TR");
      return lower.charAt(0).toLocaleUpperCase("tr-TR") + lower.slice(1);
    })
    .join(" ");
}

export function formatNamePrintNumber(raw: string): string {
  return raw.trim().replace(/\s+/g, "");
}

export type NamePrintPayload = { fullName: string; number: string };

export function normalizeNamePrintPayload(fullName: string, numberRaw: string): NamePrintPayload {
  return {
    fullName: formatTurkishTitleCaseWords(fullName),
    number: formatNamePrintNumber(numberRaw),
  };
}

function simpleStringHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

/** Aynı ürün + beden + isim/numara ile sepette satır birleşsin diye kararlı id. */
export function cartLineIdForNamePrint(
  productId: string,
  size: string,
  payload: NamePrintPayload
): string {
  const key = `${payload.fullName.toLocaleLowerCase("tr-TR")}|${payload.number.toLocaleLowerCase("tr-TR")}`;
  return `${productId}_${size}_np_${simpleStringHash(key)}`;
}
