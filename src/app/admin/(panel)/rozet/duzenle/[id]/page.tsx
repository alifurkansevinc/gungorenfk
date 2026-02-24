import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/app/admin/actions";
import { RozetFormu } from "../../RozetFormu";

export default async function AdminRozetDuzenlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) notFound();
  const supabase = await getAdminSupabase();
  const [levelRes, modulesRes, benefitsRes] = await Promise.all([
    supabase.from("fan_levels").select("*").eq("id", numId).single(),
    supabase.from("benefit_modules").select("id, name, slug, value_type, unit_label, sort_order").order("sort_order"),
    supabase.from("fan_level_benefits").select("benefit_module_id, value").eq("fan_level_id", numId),
  ]);
  const level = levelRes.data;
  const modules = modulesRes.data ?? [];
  const benefits = benefitsRes.data ?? [];
  if (!level) notFound();

  const benefitByModule: Record<string, number> = {};
  for (const b of benefits) {
    benefitByModule[(b as { benefit_module_id: string }).benefit_module_id] = Number((b as { value: number }).value);
  }

  return (
    <div>
      <Link href="/admin/rozet" className="text-sm text-bordo hover:underline">← Rozet listesi</Link>
      <h1 className="mt-4 text-2xl font-bold text-siyah">Rozet kuralını düzenle: {level.name}</h1>
      <RozetFormu level={level} modules={modules} benefitByModule={benefitByModule} />
    </div>
  );
}
