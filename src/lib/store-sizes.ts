/** Mağaza beden grupları — her ürün tek bir gruba aittir. */

export type StoreSizeGroupId = "harf" | "boy" | "yas" | "isim" | "tek";

export type StoreSizeOption = { value: string; label: string };

export type StoreSizeGroup = {
  id: StoreSizeGroupId;
  label: string;
  description: string;
  sizes: readonly StoreSizeOption[];
};

export const STORE_SIZE_GROUPS: readonly StoreSizeGroup[] = [
  {
    id: "harf",
    label: "Harf beden",
    description: "S, M, L, XL, XXL",
    sizes: [
      { value: "S", label: "S" },
      { value: "M", label: "M" },
      { value: "L", label: "L" },
      { value: "XL", label: "XL" },
      { value: "XXL", label: "XXL" },
    ],
  },
  {
    id: "boy",
    label: "Boy bedeni",
    description: "140, 152, 164, 176, XS",
    sizes: [
      { value: "140", label: "140" },
      { value: "152", label: "152" },
      { value: "164", label: "164" },
      { value: "176", label: "176" },
      { value: "XS", label: "XS" },
    ],
  },
  {
    id: "yas",
    label: "Yaş grubu",
    description: "7-8, 9-10, 11-12, 13-14, 15-16",
    sizes: [
      { value: "7-8", label: "7-8" },
      { value: "9-10", label: "9-10" },
      { value: "11-12", label: "11-12" },
      { value: "13-14", label: "13-14" },
      { value: "15-16", label: "15-16" },
    ],
  },
  {
    id: "isim",
    label: "Küçük / Orta / Büyük",
    description: "Küçük Boy, Orta Boy, Büyük Boy",
    sizes: [
      { value: "kucuk_boy", label: "Küçük Boy" },
      { value: "orta_boy", label: "Orta Boy" },
      { value: "buyuk_boy", label: "Büyük Boy" },
    ],
  },
  {
    id: "tek",
    label: "Tek beden",
    description: "Aksesuar vb. tek bedenli ürünler",
    sizes: [{ value: "tek_beden", label: "Tek Beden" }],
  },
] as const;

export const STORE_SIZE_GROUP_IDS = STORE_SIZE_GROUPS.map((g) => g.id);

/** Tüm beden değerleri (grupların birleşimi). */
export const STORE_SIZE_OPTIONS: StoreSizeOption[] = STORE_SIZE_GROUPS.flatMap((g) => [...g.sizes]);

export const STORE_SIZE_VALUES = STORE_SIZE_OPTIONS.map((o) => o.value);
export type StoreSizeValue = (typeof STORE_SIZE_VALUES)[number];

const SIZE_LABEL_MAP = new Map(STORE_SIZE_OPTIONS.map((o) => [o.value, o.label]));
const GROUP_BY_ID = new Map(STORE_SIZE_GROUPS.map((g) => [g.id, g]));

export function getSizeGroup(groupId: string | null | undefined): StoreSizeGroup | undefined {
  if (!groupId) return undefined;
  return GROUP_BY_ID.get(groupId as StoreSizeGroupId);
}

export function getSizeGroupLabel(groupId: string | null | undefined): string {
  return getSizeGroup(groupId)?.label ?? groupId ?? "—";
}

export function getSizesForGroup(groupId: string): StoreSizeOption[] {
  return [...(getSizeGroup(groupId)?.sizes ?? [])];
}

export function getSizeValuesForGroup(groupId: string): string[] {
  return getSizesForGroup(groupId).map((s) => s.value);
}

export function isValidSizeGroup(groupId: string): groupId is StoreSizeGroupId {
  return GROUP_BY_ID.has(groupId as StoreSizeGroupId);
}

export function getSizeLabel(value: string): string {
  return SIZE_LABEL_MAP.get(value) ?? value;
}

/** Mevcut ürün bedenlerinden grup tahmini (düzenleme / migration). */
export function inferSizeGroupFromSizes(sizes: string[] | null | undefined): StoreSizeGroupId {
  if (!sizes?.length) return "tek";
  if (sizes.length === 1 && sizes[0] === "tek_beden") return "tek";

  for (const group of STORE_SIZE_GROUPS) {
    const groupValues = new Set(group.sizes.map((s) => s.value));
    if (sizes.every((s) => groupValues.has(s))) return group.id;
  }

  const legacyHarf = new Set(["S", "M", "L", "XL", "XXL"]);
  if (sizes.every((s) => legacyHarf.has(s))) return "harf";

  return "harf";
}

export function filterSizesForGroup(groupId: string, sizes: string[]): string[] {
  const allowed = new Set(getSizeValuesForGroup(groupId));
  return sizes.filter((s) => allowed.has(s));
}
