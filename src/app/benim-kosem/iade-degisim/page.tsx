import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listServiceOrdersForUser } from "@/lib/order-service";
import { ServiceRequestPanel } from "@/components/order-service/ServiceRequestPanel";

export const metadata = {
  title: "İade ve beden değişimi | Güngören FK",
  description: "Teslim edilen mağaza siparişleri için iade veya beden değişimi talebi.",
};

export default async function IadeDegisimPage({
  searchParams,
}: {
  searchParams: Promise<{ siparis?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/taraftar/giris?redirect=/benim-kosem/iade-degisim");

  const { siparis } = await searchParams;
  const orders = await listServiceOrdersForUser(user.id, user.email);

  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link href="/benim-kosem" className="text-sm font-medium text-bordo hover:underline">
          Benim Köşem
        </Link>
        <h1 className="mt-3 font-display text-2xl font-bold text-siyah">İade ve beden değişimi</h1>
        <p className="mt-2 text-sm leading-6 text-siyah/70">
          Sipariş teslim edildikten sonra 14 gün içinde talep açabilirsiniz. İsim-numara yazdırılan formalar kapsama girmez. Beden değişiminde ücret farkı yoktur; ürün mağazaya geldikten sonra yeni beden verilir.
        </p>
        <div className="mt-6">
          <ServiceRequestPanel orders={orders} highlightOrderNumber={siparis} />
        </div>
      </div>
    </div>
  );
}
