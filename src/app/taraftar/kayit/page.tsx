import { KayitFormu } from "./KayitFormu";
import { getCities } from "@/lib/forms-data";

export const metadata = {
  title: "Taraftar Ol | Güngören FK",
  description: "Güngören FK taraftar kayıt formu.",
};

export default async function TaraftarKayitPage() {
  const cities = await getCities();
  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-siyah sm:text-3xl">Taraftar Ol</h1>
      <p className="mt-2 text-siyah/70">
        Formu doldurarak Güngören BFK ailesine katıl. Kayıt sonrası rozetini kazanacaksın.
      </p>
      <KayitFormu cities={cities} />
    </div>
  );
}
