/** Mağaza beden seçenekleri (admin ürün formu + müşteri seçimi). */
export const STORE_SIZE_OPTIONS = [
  { value: "S", label: "S" },
  { value: "M", label: "M" },
  { value: "L", label: "L" },
  { value: "XL", label: "XL" },
  { value: "XXL", label: "XXL" },
  { value: "tek_beden", label: "Tek Beden" },
] as const;

export const STORE_SIZE_VALUES = STORE_SIZE_OPTIONS.map((o) => o.value);
export type StoreSizeValue = (typeof STORE_SIZE_VALUES)[number];

export function getSizeLabel(value: string): string {
  return STORE_SIZE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
