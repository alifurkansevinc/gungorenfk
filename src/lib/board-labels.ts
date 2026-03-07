/** Yönetim kurulu role_slug → görünen isim */
export const BOARD_ROLE_LABELS: Record<string, string> = {
  baskan: "Başkan",
  baskan_vekili: "Başkan Yardımcısı",
  as_baskan: "Başkan Vekili",
  yk_uyesi: "Yönetim Kurulu Üyesi",
  yuksek_istisare_heyeti: "Yüksek İstişare Heyeti",
  danisman: "Danışman",
};

/** Teknik heyet role_slug → görünen isim (önem sırasına göre) */
export const TECHNICAL_STAFF_ROLE_LABELS: Record<string, string> = {
  teknik_direktor: "Teknik Direktör",
  yardimci_hoca: "A Takım | Yardımcı Antrenör",
  kaleci_antrenoru: "A Takım | Kaleci Antrenörü",
  altyapi_td: "Altyapı Antrenörü",
  gelisim_direktoru: "Atletik Performans Antrenörü",
  futbol_direktoru: "Futbol Direktörü",
  kulup_muduru: "Kulüp Müdürü",
  lojistik_muduru: "Lojistik Sorumlusu",
  fizyoterapist: "Fizyoterapist",
};
