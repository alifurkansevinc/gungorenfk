import Link from "next/link";

export const metadata = {
  title: "Mesafeli Satış Sözleşmesi | Güngören FK",
  description:
    "Güngören FK taraftar mağazası için mesafeli satış sözleşmesi, teslimat ve iade koşulları.",
};

export default function MesafeliSatisSozlesmesiPage() {
  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-siyah/60">
          <Link href="/" className="hover:text-bordo">
            Anasayfa
          </Link>
          <span className="mx-2">/</span>
          <span className="text-siyah">Mesafeli Satış Sözleşmesi</span>
        </nav>

        <div className="rounded-2xl border border-siyah/10 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-siyah sm:text-3xl">Mesafeli Satış Sözleşmesi</h1>
          <p className="mt-3 text-sm text-siyah/70">
            Son güncelleme tarihi: <strong>[GG/AA/YYYY]</strong>
          </p>

          <div className="mt-8 space-y-8 text-sm leading-7 text-siyah/85">
            <section>
              <h2 className="text-base font-semibold text-siyah">1. Taraflar</h2>
              <p className="mt-2">
                İşbu Mesafeli Satış Sözleşmesi (&quot;Sözleşme&quot;), aşağıda bilgileri bulunan satıcı ile
                internet sitesi üzerinden alışveriş yapan alıcı arasında, 6502 sayılı Tüketicinin Korunması
                Hakkında Kanun ve ilgili Mesafeli Sözleşmeler Yönetmeliği kapsamında kurulmuştur.
              </p>
              <p className="mt-2">
                <strong>Satıcı:</strong> [KULÜP/ŞİRKET UNVANI], [MERSİS/VERGİ NO], [ADRES], [E-POSTA], [TELEFON]
              </p>
              <p className="mt-1">
                <strong>Alıcı:</strong> Sipariş sırasında sisteme girilen ad-soyad/unvan, adres ve iletişim bilgileri
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-siyah">2. Konu</h2>
              <p className="mt-2">
                Sözleşmenin konusu, alıcının satıcıya ait internet sitesi üzerinden elektronik ortamda sipariş verdiği
                ürün/hizmetin satışı, teslimi ve tarafların hak ve yükümlülükleridir.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-siyah">3. Ürün/Hizmet ve Ödeme Bilgileri</h2>
              <p className="mt-2">
                Ürün adı, adedi, birim fiyatı, ara toplam, kargo ücreti ve toplam bedel sipariş özetinde belirtildiği
                gibidir. Ödeme, sitede sunulan ödeme yöntemleri (Visa, Mastercard, Troy vb.) ile güvenli ödeme altyapısı
                üzerinden alınır.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-siyah">4. Teslimat Koşulları</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Teslimat adresi, sipariş aşamasında alıcı tarafından beyan edilen adrestir.</li>
                <li>Siparişler, stok ve operasyon durumuna göre [X] iş günü içinde kargoya verilir.</li>
                <li>Kargo kaynaklı gecikmelerde satıcı makul ölçüde bilgilendirme yapar.</li>
                <li>Mağazadan teslim seçeneği varsa, teslim tarih/aralığı sipariş ekranında gösterilir.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-siyah">5. Cayma Hakkı ve İade</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  Alıcı, ürünün kendisine tesliminden itibaren 14 gün içinde herhangi bir gerekçe göstermeksizin cayma
                  hakkını kullanabilir.
                </li>
                <li>
                  Cayma hakkı, mevzuat gereği istisna ürünlerde (ör. kişiye özel hazırlanan ürünler, hijyen sebebiyle iadesi
                  uygun olmayan ürünler) kullanılamayabilir.
                </li>
                <li>İade için ürünün kullanılmamış, tekrar satılabilir durumda ve orijinal ambalajında olması gerekir.</li>
                <li>İade süreçleri için iletişim: [DESTEK E-POSTA] / [TELEFON]</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-siyah">6. Uyuşmazlık Çözümü</h2>
              <p className="mt-2">
                İşbu sözleşmeden doğabilecek uyuşmazlıklarda, Ticaret Bakanlığı tarafından ilan edilen parasal sınırlar dahilinde
                alıcının yerleşim yerindeki veya işlemin yapıldığı yerdeki Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-siyah">7. Yürürlük</h2>
              <p className="mt-2">
                Alıcı, internet sitesi üzerinden siparişi onaylayarak bu sözleşmenin tüm hükümlerini okuduğunu, anladığını
                ve kabul ettiğini beyan eder.
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
