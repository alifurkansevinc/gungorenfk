import Link from "next/link";

export const metadata = {
  title: "Gizlilik Sözleşmesi | Güngören FK",
  description:
    "Güngören Belediyesi Spor Kulübü Kişisel Verilerin Korunması ve gizlilik bildirimi.",
};

const VERI_SORUMLUSU = {
  unvan: "Güngören Belediyesi Spor Kulübü",
  adres:
    "Merkez Mahallesi, Fevzi Çakmak Caddesi Güngören Stadyumu No:17 D:3 Güngören–İstanbul",
  vergiDairesi: "Güngören",
  vergiNo: "4380761641",
  telefon: "+90 553 019 46 73",
  eposta: "destek@gungoren.com",
};

export default function GizlilikSozlesmesiPage() {
  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-siyah/60">
          <Link href="/" className="hover:text-bordo">
            Anasayfa
          </Link>
          <span className="mx-2">/</span>
          <span className="text-siyah">Gizlilik Sözleşmesi</span>
        </nav>

        <div className="rounded-2xl border border-siyah/10 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-siyah sm:text-3xl">Gizlilik Sözleşmesi / Kişisel Verilerin Korunması</h1>
          <p className="mt-3 text-sm text-siyah/70">
            Son güncelleme tarihi: <strong>01.01.2026</strong>
          </p>

          <div className="mt-6 rounded-lg border border-siyah/10 bg-siyah/[0.02] p-4 text-sm text-siyah/85">
            <p className="font-semibold text-siyah">Veri sorumlusu</p>
            <p className="mt-2">{VERI_SORUMLUSU.unvan}</p>
            <p className="mt-1">Adres: {VERI_SORUMLUSU.adres}</p>
            <p className="mt-1">
              Vergi dairesi / no: {VERI_SORUMLUSU.vergiDairesi} — {VERI_SORUMLUSU.vergiNo}
            </p>
            <p className="mt-1">Telefon: {VERI_SORUMLUSU.telefon}</p>
            <p className="mt-1">E-posta: {VERI_SORUMLUSU.eposta}</p>
          </div>

          <div className="mt-8 space-y-8 text-sm leading-7 text-siyah/85">
            <section>
              <h2 className="text-base font-semibold text-siyah">1. Amaç ve kapsam</h2>
              <p className="mt-2">
                Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında,
                {VERI_SORUMLUSU.unvan} (&quot;Veri Sorumlusu&quot;) tarafından işletilen web sitesi, taraftar
                kayıtları, mağaza siparişleri ve iletişim kanalları aracılığıyla işlenen kişisel verilerle ilgili
                bilgilendirme amacıyla hazırlanmıştır.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-siyah">2. İşlenen veri kategorileri</h2>
              <p className="mt-2">Örnek olarak aşağıdaki veriler işlenebilir:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Kimlik/iletişim: ad, soyad, e-posta, telefon, adres</li>
                <li>Üyelik ve sipariş: taraftar profili, sepet/sipariş bilgileri, ödeme işlemiyle ilgili teknik veriler</li>
                <li>İşlem güvenliği: oturum, IP, çerez ve benzeri teknolojiler</li>
                <li>İletişim: destek taleplerinizde paylaştığınız içerik</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-siyah">3. İşleme amaçları ve hukuki sebepler</h2>
              <p className="mt-2">
                Verileriniz; sözleşmenin ifası, hukuki yükümlülüklerin yerine getirilmesi, meşru menfaat
                (güvenlik, hizmet iyileştirme) ve açık rızanızın bulunması hallerinde KVKK&apos;nın 5. ve 6. maddeleri
                uyarınca işlenebilir.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-siyah">4. Aktarım</h2>
              <p className="mt-2">
                Hizmetin gerektirdiği ölçüde; ödeme altyapısı sağlayıcıları, barındırma/e-posta sağlayıcıları ve
                yasal zorunluluk halinde yetkili kurumlarla paylaşım yapılabilir. Aktarımlar KVKK ve ilgili mevzuata
                uygun gerçekleştirilir.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-siyah">5. Saklama süresi</h2>
              <p className="mt-2">
                Kişisel veriler, işleme amacının gerektirdiği süre ve ilgili mevzuatta öngörülen zamanaşımı/ saklama
                süreleri kadar muhafaza edilir; süre sonunda silinir, yok edilir veya anonim hale getirilir.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-siyah">6. KVKK kapsamındaki haklarınız</h2>
              <p className="mt-2">
                KVKK&apos;nın 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep
                etme, işlenme amacını öğrenme, yurt içinde/yurt dışında aktarılan üçüncü kişileri bilme, eksik veya
                yanlış işlenmişse düzeltilmesini isteme, silinmesini/yok edilmesini isteme, itiraz etme ve zarar
                halinde tazminat talep etme haklarına sahipsiniz.
              </p>
              <p className="mt-2">
                Taleplerinizi <strong>{VERI_SORUMLUSU.eposta}</strong> adresine veya yukarıdaki iletişim bilgileri
                üzerinden iletebilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-siyah">7. Çerezler</h2>
              <p className="mt-2">
                Site işleyişi ve güvenliği için çerezler ve benzeri teknolojiler kullanılabilir. Tarayıcı ayarlarınızdan
                çerezleri yönetebilirsiniz; bazı çerezlerin kapatılması hizmetin bir bölümünü etkileyebilir.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-siyah">8. Güncellemeler</h2>
              <p className="mt-2">
                Veri Sorumlusu, bu metni yasal düzenlemeler veya hizmet değişiklikleri nedeniyle güncelleyebilir.
                Güncel sürüm bu sayfada yayımlanır.
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
