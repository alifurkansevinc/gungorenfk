/** Yönetim kurulu role_slug → görünen isim */
export const BOARD_ROLE_LABELS: Record<string, string> = {
  baskan: "Başkan",
  baskan_vekili: "Başkan Yardımcısı",
  as_baskan: "As Başkan",
  yk_uyesi: "Yönetim Kurulu Üyesi",
  yuksek_istisare_heyeti: "Yüksek İstişare Heyeti",
  danisman: "Danışman",
};

/** Teknik heyet role_slug → görünen isim (önem sırasına göre) */
export const TECHNICAL_STAFF_ROLE_LABELS: Record<string, string> = {
  teknik_direktor: "Teknik Direktör",
  yardimci_hoca: "Yardımcı Hoca",
  kaleci_antrenoru: "Kaleci Antrenörü",
  altyapi_td: "Altyapı Teknik Direktörü",
  gelisim_direktoru: "Gelişim Direktörü",
  futbol_direktoru: "Futbol Direktörü",
  kulup_muduru: "Kulüp Müdürü",
  lojistik_muduru: "Lojistik Müdürü",
  fizyoterapist: "Fizyoterapist",
};
