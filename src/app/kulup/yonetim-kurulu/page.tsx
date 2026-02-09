import Link from "next/link";
import { FadeInSection } from "@/components/FadeInSection";

/** Demo yönetim kurulu — ileride Supabase veya CMS'ten gelebilir */
const DEMO_BOARD = [
  { name: "Ahmet Yılmaz", title: "Başkan" },
  { name: "Mehmet Kaya", title: "Başkan Yardımcısı" },
  { name: "Ali Demir", title: "Genel Sekreter" },
  { name: "Ayşe Özkan", title: "Sayman" },
  { name: "Fatma Çelik", title: "Üye" },
  { name: "Mustafa Arslan", title: "Üye" },
  { name: "Zeynep Aydın", title: "Üye" },
];

export default function YonetimKuruluPage() {
  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      <section className="border-b border-siyah/10 bg-siyah py-12 sm:py-16 text-beyaz">
        <div className="mx-auto max-w-4xl px-6">
          <Link href="/kulup" className="text-sm font-medium text-beyaz/70 hover:text-beyaz transition-colors">
            ← Kulüp
          </Link>
          <p className="font-display mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-bordo">
            Kulüp
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Yönetim Kurulu
          </h1>
          <p className="mt-3 text-beyaz/80">
            Güngören Belediye Spor Kulübü yönetim kurulu üyeleri.
          </p>
        </div>
      </section>

      <FadeInSection>
        <section className="bg-beyaz py-14 sm:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DEMO_BOARD.map((person, i) => (
                <div
                  key={i}
                  className="flex flex-col rounded-2xl border border-siyah/10 bg-[#f8f8f8] p-6 transition-shadow hover:shadow-md"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-bordo/15 text-bordo font-display font-bold text-lg">
                    {person.name.charAt(0)}
                  </div>
                  <h3 className="font-display mt-4 font-semibold text-siyah">{person.name}</h3>
                  <p className="mt-1 text-sm font-medium text-bordo">{person.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeInSection>
    </div>
  );
}
