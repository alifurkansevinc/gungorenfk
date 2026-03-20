/**
 * Admin panel rol ve menü yetkileri.
 * Menü href'leri AdminShell'deki menuItems ile eşleşir.
 */

export type AdminRole =
  | "admin"
  | "operator"
  | "club_manager"
  | "football_director"
  | "event_coordinator";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  admin: "Admin",
  operator: "Operatör",
  club_manager: "Kulüp Müdürü",
  football_director: "Futbol Direktörü",
  event_coordinator: "Etkinlik Sorumlusu",
};

/** Menü path'leri (href'ten /admin prefix'i çıkarılmış). */
export const MENU_KEYS = {
  dashboard: "",
  admins: "admins",
  oneCikan: "one-cikan",
  siparisler: "siparisler",
  magaza: "magaza",
  teslimAl: "teslim-al",
  bagislar: "bagislar",
  biletler: "biletler",
  ayarlar: "ayarlar",
  taraftarlar: "taraftarlar",
  hediyeVerme: "hediye-verme",
  maclar: "maclar",
  kadro: "kadro",
  transferler: "transferler",
  haberler: "haberler",
  yonetimKurulu: "yonetim-kurulu",
  teknikHeyet: "teknik-heyet",
  rozet: "rozet",
  avantajModulleri: "avantaj-modulleri",
  galeriler: "galeriler",
  kupaMuzesi: "kupa-muzesi",
} as const;

/** Rol başına erişilebilir menü anahtarları. Admin tüm menülere erişir (özel kontrol). */
const ROLE_MENUS: Record<Exclude<AdminRole, "admin">, readonly string[]> = {
  operator: [
    MENU_KEYS.magaza,
    MENU_KEYS.siparisler,
    MENU_KEYS.teslimAl,
    MENU_KEYS.biletler,
    MENU_KEYS.hediyeVerme,
    MENU_KEYS.haberler,
    MENU_KEYS.maclar,
    MENU_KEYS.galeriler,
  ],
  club_manager: [
    MENU_KEYS.magaza,
    MENU_KEYS.siparisler,
    MENU_KEYS.teslimAl,
    MENU_KEYS.biletler,
    MENU_KEYS.hediyeVerme,
    MENU_KEYS.haberler,
    MENU_KEYS.maclar,
    MENU_KEYS.bagislar,
    MENU_KEYS.taraftarlar,
  ],
  football_director: [MENU_KEYS.maclar, MENU_KEYS.kadro, MENU_KEYS.transferler],
  event_coordinator: [
    MENU_KEYS.maclar,
    MENU_KEYS.biletler,
    MENU_KEYS.hediyeVerme,
    MENU_KEYS.haberler,
    MENU_KEYS.taraftarlar,
  ],
};

/**
 * Path'ten menü/yetki anahtarı: yalnızca ilk segment (bölüm).
 * Örn. /admin/magaza/yeni ve /admin/magaza/duzenle/uuid → "magaza"
 * Böylece AdminRouteGuard alt sayfalarda da doğru rolle eşleşir.
 */
export function hrefToMenuKey(href: string): string {
  const pathOnly = href.split("?")[0] ?? href;
  if (pathOnly === "/admin" || pathOnly === "/admin/") return MENU_KEYS.dashboard;
  const prefix = "/admin/";
  if (!pathOnly.startsWith(prefix)) return pathOnly;
  const rest = pathOnly.slice(prefix.length).replace(/\/$/, "");
  const first = rest.split("/").filter(Boolean)[0];
  return first ?? MENU_KEYS.dashboard;
}

/** Bu rol bu menüye erişebilir mi? */
export function canAccessMenu(role: AdminRole, menuKey: string): boolean {
  if (role === "admin") return true;
  if (menuKey === MENU_KEYS.dashboard) return true;
  const allowed = ROLE_MENUS[role];
  return allowed.includes(menuKey);
}

/** Bu rol bu path'e (örn. /admin/maclar) erişebilir mi? */
export function canAccessPath(role: AdminRole, pathname: string): boolean {
  const key = pathname.startsWith("/admin") ? hrefToMenuKey(pathname) : pathname;
  return canAccessMenu(role, key);
}

/** Rol için gösterilecek menü anahtarları (dashboard her zaman dahil). */
export function getAllowedMenuKeys(role: AdminRole): string[] {
  if (role === "admin") return Object.values(MENU_KEYS);
  return [MENU_KEYS.dashboard, ...ROLE_MENUS[role]];
}
