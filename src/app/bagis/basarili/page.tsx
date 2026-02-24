import { createServiceRoleClient } from "@/lib/supabase/service";
import { CheckCircle, Sparkles, FileText } from "lucide-react";
import { BasariliClientLinks } from "./BasariliClientLinks";

type Props = { searchParams: Promise<{ id?: string; levelUp?: string; newLevel?: string }> };

export default async function BagisBasariliPage({ searchParams }: Props) {
  const params = await searchParams;
  const donationId = params.id;
  const levelUp = params.levelUp === "1";

  let donation: {
    amount: number;
    receipt_number: string | null;
    guest_name: string | null;
    user_id: string | null;
    created_at: string;
    message: string | null;
    donor_type: string | null;
    title: string | null;
    address: string | null;
  } | null = null;
  let receiptTitle = "Bağış Makbuzu";
  let receiptBody = "Bu makbuz, Güngören Belediye Spor Kulübü'ne yapılan bağışı belgelemektedir. Bağışçıya ve kulübümüze verdiği destek için teşekkür ederiz.";

  if (donationId) {
    const supabase = createServiceRoleClient();
    const { data: d } = await supabase
      .from("donations")
      .select("amount, receipt_number, guest_name, user_id, created_at, message, donor_type, title, address")
      .eq("id", donationId)
      .eq("payment_status", "PAID")
      .single();
    donation = d ?? null;

    const { data: row } = await supabase.from("site_settings").select("value").eq("key", "donation_receipt_template").single();
    const template = (row?.value as { title?: string; body?: string }) ?? {};
    if (template.title) receiptTitle = template.title;
    if (template.body) receiptBody = template.body;
  }

  let displayName = donation?.guest_name ?? "Bağışçı";
  if (donation?.user_id) {
    const supabase = createServiceRoleClient();
    const { data: profile } = await supabase
      .from("fan_profiles")
      .select("first_name, last_name")
      .eq("user_id", donation.user_id)
      .single();
    if (profile) displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || displayName;
  }
  const receiptBodyFilled = receiptBody
    .replace(/\{\{receipt_number\}\}/g, donation?.receipt_number ?? "—")
    .replace(/\{\{amount\}\}/g, donation ? Number(donation.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "—")
    .replace(/\{\{date\}\}/g, donation ? new Date(donation.created_at).toLocaleDateString("tr-TR") : "—")
    .replace(/\{\{name\}\}/g, displayName)
    .replace(/\{\{message\}\}/g, donation?.message ?? "—");

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center px-4 py-10">
      <div className="max-w-lg w-full space-y-6">
        <div className="rounded-2xl border border-siyah/10 bg-beyaz p-8 shadow-lg text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
          <h1 className="mt-4 font-display text-2xl font-bold text-siyah">Bağışınız için teşekkürler</h1>
          <p className="mt-2 text-siyah/70">
            Destekleriniz kulübümüz için çok değerli. Güngören FK ailesi olarak minnettarız.
          </p>
          {levelUp && (
            <div className="mt-6 rounded-xl bg-bordo/10 border border-bordo/20 p-4">
              <Sparkles className="mx-auto h-10 w-10 text-bordo" />
              <p className="mt-2 font-bold text-bordo">Tebrikler! Seviye atladınız!</p>
              <p className="mt-1 text-sm text-siyah/80">
                Taraftar rozet baremleriniz doldu ve bir üst seviyeye geçtiniz. Yeni rozetinizi Benim Köşem’den görebilirsiniz.
              </p>
            </div>
          )}
          <BasariliClientLinks />
        </div>

        {donation && (
          <div className="rounded-2xl border-2 border-siyah/10 bg-beyaz p-6 shadow-lg">
            <div className="flex items-center gap-2 border-b border-siyah/10 pb-3 mb-4">
              <FileText className="h-6 w-6 text-bordo" />
              <h2 className="font-display text-lg font-bold text-siyah">{receiptTitle}</h2>
            </div>
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-siyah/10">
              <span className="text-sm text-siyah/60">Makbuz No</span>
              <span className="font-mono font-bold text-bordo">{donation.receipt_number ?? "—"}</span>
            </div>
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-siyah/60">Bağışçı</dt>
                <dd className="font-medium text-siyah">{displayName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-siyah/60">Tutar</dt>
                <dd className="font-semibold text-bordo">{Number(donation.amount).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-siyah/60">Tarih</dt>
                <dd className="text-siyah">{new Date(donation.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</dd>
              </div>
              {donation.message && (
                <div className="flex justify-between">
                  <dt className="text-siyah/60">Açıklama</dt>
                  <dd className="text-siyah">{donation.message}</dd>
                </div>
              )}
            </dl>
            <div className="mt-4 pt-4 border-t border-siyah/10 text-sm text-siyah/70 whitespace-pre-line">
              {receiptBodyFilled}
            </div>
            <p className="mt-4 text-xs text-siyah/50 text-center">
              Bu makbuzu yazdırabilir veya saklayabilirsiniz.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
