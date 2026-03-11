import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSquad, getFanLevels, getLevelBenefits, getGiftQuotaForLevel } from "@/lib/data";
import type { FanLevel } from "@/types/db";
import { FanLevelBadge } from "@/app/taraftar/FanLevelBadge";
import { FavoriOyuncuSec } from "./FavoriOyuncuSec";

export const metadata = {
  title: "Benim Köşem | Güngören FK",
  description: "Taraftar paneli: rozet, favori oyuncu, haklar.",
};

/** Modül avantajını tek satır metne çevirir (Benim Köşem listesi için). */
function formatBenefit(b: { name: string; value_type: string; value: number; unit_label: string | null }): string {
  if (b.value_type === "boolean") return b.value === 1 ? b.name : "";
  if (b.value_type === "percent") return `${b.name}: %${Math.round(b.value)}`;
  return `${b.name}: ${b.value} ${b.unit_label || ""}`.trim();
}

/** Seviyeye göre hak kazandıklarım metni (backend ile genişletilebilir). */
function getHakKazandiklarim(levelSlug: string): string[] {
  const haklar: Record<string, string[]> = {
    "as-oyuncu": ["Resmi taraftar rozeti", "Maestro’ya doğru ilerleme hakkı"],
    maestro: ["Maçların vazgeçilmezi rozeti", "Kapitano’ya doğru ilerleme hakkı"],
    kapitano: ["Koltuk numarası", "Mağazada %25 indirim", "General’a doğru ilerleme hakkı"],
    general: ["Resmi kongre üyesi", "Mağazada %30 indirim", "Efsane’ye doğru ilerleme hakkı"],
    efsane: [
      "Her sene 2 sezon forman isminle",
      "Her sene 5 maç protokol bileti",
      "Mağazada %35 indirim",
      "Her sene 10 takım rozeti",
      "Atkı, şapka, yağmurluk seti",
    ],
  };
  return haklar[levelSlug] ?? haklar["as-oyuncu"];
}

export default async function BenimKosemPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/taraftar/kayit");

  const { data: profile } = await supabase
    .from("fan_profiles")
    .select("*, fan_levels(id, name, slug, min_points, sort_order, description, target_store_spend, target_tickets, target_donation, advantages)")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/taraftar/kayit");

  const [squad, levels] = await Promise.all([getSquad(), getFanLevels()]);
  const level = profile.fan_levels as FanLevel | null;
  const currentLevel: FanLevel = level ?? levels[0] ?? { id: 1, name: "As Oyuncu", slug: "as-oyuncu", min_points: 0, sort_order: 1, description: null, target_store_spend: null, target_tickets: null, target_donation: null, advantages: null };
  const currentLevelWithAdvantages = levels.find((l) => l.id === currentLevel.id) ?? currentLevel;
  const nextLevel = levels.find((l) => l.sort_order === currentLevel.sort_order + 1);
  const [currentLevelBenefits, nextLevelBenefits, giftQuota] = await Promise.all([
    getLevelBenefits(currentLevel.id),
    nextLevel ? getLevelBenefits(nextLevel.id) : Promise.resolve([]),
    getGiftQuotaForLevel(currentLevel.id),
  ]);
  const currentLevelBenefitsFiltered = currentLevelBenefits.map(formatBenefit).filter(Boolean);
  const nextLevelBenefitsFiltered = nextLevelBenefits.map(formatBenefit).filter(Boolean);
  const year = new Date().getFullYear();
  const { count: giftUsedCount } = await supabase
    .from("gift_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("redemption_year", year)
    .eq("granted_by_admin", false);
  const { data: pendingGifts } = await supabase
    .from("gift_redemptions")
    .select("id, qr_code, store_products(name)")
    .eq("user_id", user.id)
    .eq("status", "pending_pickup")
    .order("created_at", { ascending: false });
  const favoritePlayerId = (profile as { favorite_player_id?: string | null }).favorite_player_id ?? null;
  const favoritePlayer = favoritePlayerId ? squad.find((p) => p.id === favoritePlayerId) : null;

  const profileStoreSpend = Number((profile as { store_spend_total?: number }).store_spend_total ?? 0);
  const donationTotal = Number((profile as { donation_total?: number }).donation_total ?? 0);
  const userEmail = (profile as { email?: string | null }).email ?? user.email ?? "";

  // Efektif mağaza harcaması: üye + aynı e-postayla yapılan misafir siparişlerinin toplamı (barem doğru ilerlesin)
  const { data: paidOrdersForSpend } = await supabase
    .from("orders")
    .select("total")
    .eq("payment_status", "PAID")
    .or(userEmail ? `user_id.eq.${user.id},and(user_id.is.null,guest_email.eq.${userEmail})` : `user_id.eq.${user.id}`);
  const storeSpend = (paidOrdersForSpend ?? []).reduce((sum, o) => sum + Number((o as { total: number }).total || 0), 0);

  const { data: myTickets } = await supabase
    .from("match_tickets")
    .select("id, qr_code, match_id, event_id, stadium_seats(seat_code), matches(opponent_name, match_date, match_time, venue, home_away), news(title, event_date, event_time, event_place)")
    .eq("user_id", user.id)
    .eq("payment_status", "PAID")
    .order("created_at", { ascending: false })
    .limit(50);

  // Mağazadan teslim alınacak siparişler (Store cüzdanım) — üye siparişleri + aynı e-posta ile yapılmış misafir siparişleri
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const { data: ordersByUser } = await supabase
    .from("orders")
    .select("id, order_number, pickup_code, pickup_date, status, created_at")
    .eq("user_id", user.id)
    .eq("delivery_method", "store_pickup")
    .eq("payment_status", "PAID")
    .not("pickup_code", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);
  const guestOrdersRes = userEmail
    ? await supabase
        .from("orders")
        .select("id, order_number, pickup_code, pickup_date, status, created_at")
        .is("user_id", null)
        .eq("guest_email", userEmail)
        .eq("delivery_method", "store_pickup")
        .eq("payment_status", "PAID")
        .not("pickup_code", "is", null)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: null as (typeof ordersByUser) };
  const storePickupOrdersAll = [...(ordersByUser ?? []), ...(guestOrdersRes.data ?? [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);
  // Store cüzdanımda sadece henüz teslim alınmamış siparişler; kullanılan (DELIVERED) QR'lar sadece Geçmiş siparişlerde
  const storePickupOrders = storePickupOrdersAll.filter((o) => (o as { status: string }).status !== "DELIVERED");

  const { data: pastOrdersByUser } = await supabase
    .from("orders")
    .select("id, order_number, status, created_at, delivery_method")
    .eq("user_id", user.id)
    .in("status", ["DELIVERED", "SHIPPED"])
    .order("created_at", { ascending: false })
    .limit(30);
  const pastOrdersGuest = userEmail
    ? await supabase
        .from("orders")
        .select("id, order_number, status, created_at, delivery_method")
        .is("user_id", null)
        .eq("guest_email", userEmail)
        .in("status", ["DELIVERED", "SHIPPED"])
        .order("created_at", { ascending: false })
        .limit(30)
    : { data: null as typeof pastOrdersByUser };
  const pastOrders = [...(pastOrdersByUser ?? []), ...(pastOrdersGuest.data ?? [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 30);

  let motmCount = 0;
  if (favoritePlayerId) {
    const { count } = await supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("status", "finished")
      .eq("man_of_the_match_id", favoritePlayerId);
    motmCount = count ?? 0;
  }

  const ticketsCount = new Set((myTickets ?? []).filter((t) => (t as { match_id: string | null }).match_id).map((t) => (t as { match_id: string }).match_id)).size;

  type MatchRow = { opponent_name: string; match_date: string; match_time: string | null; venue: string | null; home_away: string };
  type NewsRow = { title: string; event_date: string | null; event_time: string | null; event_place: string | null };
  const ticketsWithMatch = (myTickets ?? []).map((t) => {
    const raw = t as unknown as {
      matches?: MatchRow | MatchRow[] | null;
      stadium_seats?: { seat_code: string } | { seat_code: string }[] | null;
      news?: NewsRow | NewsRow[] | null;
      event_id?: string | null;
    };
    const m = Array.isArray(raw.matches) ? raw.matches[0] : raw.matches;
    const seat = Array.isArray(raw.stadium_seats) ? raw.stadium_seats[0] : raw.stadium_seats;
    const newsItem = Array.isArray(raw.news) ? raw.news[0] : raw.news;
    const isEvent = !!raw.event_id;
    const macLabel = m && !isEvent
      ? (m.home_away === "home" ? `Güngören FK - ${m.opponent_name}` : `${m.opponent_name} - Güngören FK`)
      : null;
    const eventTitle = newsItem?.title ?? "Etkinlik";
    const eventDate = newsItem?.event_date;
    const eventTime = newsItem?.event_time;
    const eventPlace = newsItem?.event_place;
    return {
      id: t.id,
      qr_code: t.qr_code,
      seat_code: seat?.seat_code ?? null,
      isEvent,
      label: isEvent ? eventTitle : macLabel ?? "Maç",
      match_date: m?.match_date,
      match_time: m?.match_time,
      venue: m?.venue,
      home_away: m?.home_away,
      event_date: eventDate,
      event_time: eventTime,
      event_place: eventPlace,
    };
  });

  const today = new Date().toISOString().slice(0, 10);
  const activeTickets = ticketsWithMatch.filter((t) => {
    const date = t.isEvent ? t.event_date : t.match_date;
    return date && date >= today;
  });
  const pastMatchTickets = ticketsWithMatch.filter((t) => !t.isEvent && t.match_date && t.match_date < today);
  const pastEventTickets = ticketsWithMatch.filter((t) => t.isEvent && t.event_date && t.event_date < today);

  const nextTargetStore = nextLevel?.target_store_spend != null ? Number(nextLevel.target_store_spend) : 500;
  const nextTargetTickets = nextLevel?.target_tickets ?? 5;
  const nextTargetDonation = nextLevel?.target_donation != null ? Number(nextLevel.target_donation) : 100;
  const barStore = nextTargetStore > 0 ? Math.min(100, (storeSpend / nextTargetStore) * 100) : 0;
  const barTickets = nextTargetTickets > 0 ? Math.min(100, (ticketsCount / nextTargetTickets) * 100) : 0;
  const barDonation = nextTargetDonation > 0 ? Math.min(100, (donationTotal / nextTargetDonation) * 100) : 0;
  const favoriteMotmBonus = Math.min(2, motmCount) * 5;
  const overallBar = nextLevel
    ? Math.min(100, (barStore + barTickets + barDonation) / 3 + favoriteMotmBonus)
    : 100;

  const mevcutAvantajlarListe = [
    ...currentLevelBenefitsFiltered,
    ...(currentLevelWithAdvantages.advantages?.trim()
      ? currentLevelWithAdvantages.advantages.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
      : getHakKazandiklarim(currentLevel.slug)),
  ];
  const sonrakiAvantajlarListe = [
    ...nextLevelBenefitsFiltered,
    ...(nextLevel?.advantages?.trim()
      ? nextLevel.advantages.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
      : []),
  ];

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#f8f8f8]">
      <div className="border-b border-siyah/10 bg-siyah text-beyaz">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 min-w-0">
          <nav className="text-sm text-beyaz/60 truncate">
            <Link href="/" className="hover:text-beyaz">Anasayfa</Link>
            <span className="mx-2">/</span>
            <span className="text-beyaz">Benim Köşem</span>
          </nav>
          <h1 className="font-display mt-2 text-2xl font-bold sm:text-3xl break-words">Benim Köşem</h1>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 min-w-0">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
          <div className="min-w-0 lg:col-span-2 space-y-6">
            {/* Rozet + mevcut rütbenin avantajları */}
            <section className="rounded-2xl border border-siyah/10 bg-beyaz p-4 sm:p-6 shadow-sm min-w-0 overflow-hidden">
              <h2 className="font-display text-lg font-bold text-siyah break-words">Güngören BFK Rozeti</h2>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <FanLevelBadge levelSlug={currentLevel.slug} levelName={currentLevel.name} />
              </div>
              {currentLevel.description && (
                <p className="mt-4 text-sm text-siyah/80 leading-relaxed break-words">{currentLevel.description}</p>
              )}
              {mevcutAvantajlarListe.length > 0 && (
                <>
                  <h3 className="mt-4 text-sm font-semibold text-siyah/80">Mevcut rütbenin avantajları</h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-siyah/80 break-words">
                    {mevcutAvantajlarListe.map((madde, i) => (
                      <li key={i} className="break-words">{madde}</li>
                    ))}
                  </ul>
                </>
              )}
              {currentLevel.sort_order >= 2 && (
                <p className="mt-2 text-xs text-siyah/60 break-words">
                  Takım rozeti (beyaz rozet) kulüp tarafından QR kod ile verilir; Store cüzdanında görünecektir.
                </p>
              )}
            </section>

            {/* Sonraki rozetin için — sonraki rütbenin avantajları + 3 barem */}
            {nextLevel && (
              <section className="rounded-2xl border border-siyah/10 bg-beyaz p-4 sm:p-6 shadow-sm min-w-0 overflow-hidden">
                <h2 className="font-display text-lg font-bold text-siyah break-words">Sonraki rozetin için</h2>
                <p className="mt-1 text-sm text-siyah/70 break-words">Sonraki kademe: <strong>{nextLevel.name}</strong>.</p>
                {sonrakiAvantajlarListe.length > 0 && (
                  <>
                    <h3 className="mt-3 text-sm font-semibold text-siyah/80">Sonraki rütbenin avantajları</h3>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-siyah/80 break-words">
                      {sonrakiAvantajlarListe.map((madde, i) => (
                        <li key={i} className="break-words">{madde}</li>
                      ))}
                    </ul>
                  </>
                )}
                <div className="mt-4 space-y-4 min-w-0">
                  <div className="min-w-0">
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-nowrap sm:justify-between sm:items-center">
                      <span className="font-medium text-siyah/80 text-sm break-words min-w-0">Mağaza alışveriş baremi</span>
                      <span className="tabular-nums text-siyah/70 text-sm shrink-0">{storeSpend.toFixed(0)} ₺ / {nextTargetStore} ₺</span>
                    </div>
                    <div className="mt-1 h-2.5 w-full min-w-0 overflow-hidden rounded-full bg-siyah/10">
                      <div className="progress-fill h-full rounded-full bg-bordo" style={{ width: `${barStore}%` }} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-nowrap sm:justify-between sm:items-center">
                      <span className="font-medium text-siyah/80 text-sm break-words min-w-0">Maç biletleri baremi</span>
                      <span className="tabular-nums text-siyah/70 text-sm shrink-0">{ticketsCount} / {nextTargetTickets}</span>
                    </div>
                    <div className="mt-1 h-2.5 w-full min-w-0 overflow-hidden rounded-full bg-siyah/10">
                      <div className="progress-fill h-full rounded-full bg-bordo" style={{ width: `${barTickets}%` }} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-nowrap sm:justify-between sm:items-center">
                      <span className="font-medium text-siyah/80 text-sm break-words min-w-0">Bağış baremi</span>
                      <span className="tabular-nums text-siyah/70 text-sm shrink-0">{donationTotal.toFixed(0)} ₺ / {nextTargetDonation} ₺</span>
                    </div>
                    <div className="mt-1 h-2.5 w-full min-w-0 overflow-hidden rounded-full bg-siyah/10">
                      <div className="progress-fill h-full rounded-full bg-bordo" style={{ width: `${barDonation}%` }} />
                    </div>
                  </div>
                  {favoriteMotmBonus > 0 && (
                    <p className="text-xs text-siyah/60 break-words">
                      Favori oyuncun {motmCount} kez maçın oyuncusu seçildi: <span className="font-medium text-bordo">+{favoriteMotmBonus}%</span>
                    </p>
                  )}
                  <div className="pt-2 min-w-0">
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:flex-nowrap sm:justify-between sm:items-center">
                      <span className="font-semibold text-siyah text-sm break-words min-w-0">Toplam ilerleme (sonraki rozet)</span>
                      <span className="tabular-nums text-bordo font-medium text-sm shrink-0">{Math.round(overallBar)}%</span>
                    </div>
                    <div className="mt-1 h-3 w-full min-w-0 overflow-hidden rounded-full bg-siyah/10">
                      <div className="progress-fill progress-bar-glow h-full rounded-full bg-bordo" style={{ width: `${overallBar}%` }} />
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] text-siyah/55 break-words">
                    <strong>Barem hareketi:</strong> Mağaza = Ödenen mağaza siparişlerinizin toplam tutarı (giriş yaparak veya aynı e-postayla). Bilet = Ödenen maç/etkinlik bilet sayısı. Bağış = Yaptığınız bağışların toplamı. Toplam ilerleme = Üç baremin ortalaması + favori oyuncu MOTM bonusu (en fazla +10%).
                  </p>
                </div>
              </section>
            )}
            {!nextLevel && (
              <section className="rounded-2xl border border-siyah/10 bg-beyaz p-4 sm:p-6 shadow-sm min-w-0 overflow-hidden">
                <h2 className="font-display text-lg font-bold text-siyah break-words">Sonraki rozetin için</h2>
                <p className="mt-2 text-sm text-siyah/70 break-words">En yüksek kademe (Efsane) rozetindesin.</p>
              </section>
            )}

            {/* Bilet cüzdanı — sadece maç ve etkinlik biletleri (rozet teslim bileti yok) */}
            <section className="rounded-2xl border border-siyah/10 bg-beyaz p-4 sm:p-6 shadow-sm min-w-0 overflow-hidden">
              <h2 className="font-display text-lg font-bold text-siyah break-words">Bilet cüzdanım</h2>
              <p className="mt-1 text-sm text-siyah/70 break-words">Aldığınız maç ve etkinlik biletleri.</p>
              {activeTickets.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-siyah/20 bg-siyah/[0.02] p-6 text-center">
                  <p className="text-sm text-siyah/60">Henüz biletiniz yok.</p>
                  <Link href="/biletler" className="mt-3 inline-block text-sm font-medium text-bordo hover:underline">Biletler →</Link>
                </div>
              ) : (
                <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2 min-w-0">
                  {activeTickets.map((t) => {
                    const qrUrl = t.qr_code
                      ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(t.qr_code)}`
                      : null;
                    const subLine = t.isEvent
                      ? [t.event_date ? new Date(t.event_date + "T12:00:00").toLocaleDateString("tr-TR") : "", t.event_time, t.event_place].filter(Boolean).join(" · ")
                      : `${t.match_date ? new Date(t.match_date + "T12:00:00").toLocaleDateString("tr-TR") : ""}${t.match_time ? ` · ${t.match_time}` : ""}${t.venue ? ` · ${t.venue}` : ""}`;
                    return (
                      <Link
                        key={t.id}
                        href={`/biletler/basarili?qrCode=${t.qr_code}${t.isEvent ? "&type=event" : ""}`}
                        className="flex items-center gap-3 sm:gap-4 rounded-xl border border-siyah/10 bg-gradient-to-br from-siyah/5 to-bordo/5 p-4 transition-shadow hover:shadow-md min-w-0"
                      >
                        {qrUrl && (
                          <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-lg border border-siyah/10 bg-beyaz">
                            <img src={qrUrl} alt="QR" width={56} height={56} className="h-full w-full object-contain" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="font-semibold text-siyah text-sm sm:text-base truncate">{t.label}</p>
                          {t.isEvent && <span className="text-[10px] font-medium text-bordo/80 uppercase tracking-wide">Etkinlik</span>}
                          <p className="text-xs text-siyah/60 mt-0.5 truncate">{subLine}</p>
                          {t.seat_code && <p className="mt-0.5 text-xs font-medium text-bordo">Koltuk: {t.seat_code}</p>}
                        </div>
                        <span className="shrink-0 text-xs font-medium text-bordo">Göster</span>
                      </Link>
                    );
                  })}
                </div>
              )}
              {activeTickets.length > 0 && (
                <Link href="/biletler" className="mt-4 block text-center text-sm font-medium text-bordo hover:underline">Yeni bilet al →</Link>
              )}
            </section>

            {/* Store cüzdanım — mağazadan teslim alınacak siparişler, QR ile (Bilet cüzdanımın hemen altında) */}
            <section className="rounded-2xl border border-siyah/10 bg-beyaz p-4 sm:p-6 shadow-sm min-w-0 overflow-hidden">
              <h2 className="font-display text-lg font-bold text-siyah break-words">Store cüzdanım</h2>
              <p className="mt-1 text-sm text-siyah/70 break-words">Mağazadan teslim alacağınız siparişler. Teslim alırken bu QR kodunu gösterin.</p>
              {(!storePickupOrders || storePickupOrders.length === 0) ? (
                <div className="mt-4 rounded-xl border border-dashed border-siyah/20 bg-siyah/[0.02] p-6 text-center">
                  <p className="text-sm text-siyah/60">Mağazadan teslim alacağınız siparişiniz yok.</p>
                  <Link href="/magaza" className="mt-3 inline-block text-sm font-medium text-bordo hover:underline">Mağaza →</Link>
                </div>
              ) : (
                <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2 min-w-0">
                  {storePickupOrders.map((o) => {
                    const pickupCode = (o as { pickup_code: string }).pickup_code;
                    const qrData = `${baseUrl}/admin/teslim-al?code=${encodeURIComponent(pickupCode)}`;
                    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrData)}`;
                    const pickupDate = (o as { pickup_date: string | null }).pickup_date;
                    return (
                      <Link
                        key={o.id}
                        href={`/benim-kosem/store-qr?code=${encodeURIComponent(pickupCode)}&orderNumber=${encodeURIComponent(o.order_number)}`}
                        className="flex items-center gap-3 sm:gap-4 rounded-xl border border-siyah/10 bg-gradient-to-br from-siyah/5 to-bordo/5 p-4 min-w-0 overflow-hidden transition-shadow hover:shadow-md"
                      >
                        {qrImgUrl && (
                          <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-lg border border-siyah/10 bg-beyaz">
                            <img src={qrImgUrl} alt="Teslim QR" width={56} height={56} className="h-full w-full object-contain" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="font-semibold text-sm sm:text-base truncate text-siyah">Sipariş {o.order_number}</p>
                          {pickupDate && (
                            <p className="text-xs text-siyah/60 mt-0.5 break-words">
                              Teslim: {new Date(pickupDate + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                          )}
                          <p className="mt-0.5 font-mono text-xs text-siyah/70 truncate">Kod: {pickupCode}</p>
                        </div>
                        <span className="shrink-0 text-xs font-medium text-bordo">Göster</span>
                      </Link>
                    );
                  })}
                </div>
              )}
              {storePickupOrders && storePickupOrders.length > 0 && (
                <Link href="/magaza" className="mt-4 block text-center text-sm font-medium text-bordo hover:underline">Mağaza →</Link>
              )}
            </section>

            {/* Geçmiş biletler (maç) */}
            <section className="rounded-2xl border border-siyah/10 bg-beyaz p-4 sm:p-6 shadow-sm min-w-0 overflow-hidden">
              <h2 className="font-display text-lg font-bold text-siyah break-words">Geçmiş biletler</h2>
              <p className="mt-1 text-sm text-siyah/70 break-words">Oynanmış maçlara ait biletleriniz.</p>
              {pastMatchTickets.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-siyah/20 bg-siyah/[0.02] p-6 text-center">
                  <p className="text-sm text-siyah/60">Geçmiş maç biletiniz yok.</p>
                </div>
              ) : (
                <ul className="mt-4 space-y-2 min-w-0">
                  {pastMatchTickets.map((t) => (
                    <li key={t.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-siyah/10 bg-siyah/[0.02] px-4 py-3 min-w-0">
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-siyah/80 text-sm break-words">{t.label}</span>
                        <span className="mt-1.5 inline-flex items-center rounded-md bg-siyah/10 px-2 py-0.5 text-[11px] font-medium text-siyah/70">QR üzerinde kullanıldı · Tekrar kullanılamaz</span>
                      </div>
                      <span className="text-sm text-siyah/60 shrink-0">
                        {t.match_date ? new Date(t.match_date + "T12:00:00").toLocaleDateString("tr-TR") : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Geçmiş etkinlikler */}
            <section className="rounded-2xl border border-siyah/10 bg-beyaz p-4 sm:p-6 shadow-sm min-w-0 overflow-hidden">
              <h2 className="font-display text-lg font-bold text-siyah break-words">Geçmiş etkinlikler</h2>
              <p className="mt-1 text-sm text-siyah/70 break-words">Katıldığınız geçmiş etkinlikler.</p>
              {pastEventTickets.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-siyah/20 bg-siyah/[0.02] p-6 text-center">
                  <p className="text-sm text-siyah/60">Geçmiş etkinlik biletiniz yok.</p>
                </div>
              ) : (
                <ul className="mt-4 space-y-2 min-w-0">
                  {pastEventTickets.map((t) => (
                    <li key={t.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-siyah/10 bg-siyah/[0.02] px-4 py-3 min-w-0">
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-siyah/80 text-sm break-words">{t.label}</span>
                        <span className="mt-1.5 inline-flex items-center rounded-md bg-siyah/10 px-2 py-0.5 text-[11px] font-medium text-siyah/70">QR üzerinde kullanıldı · Tekrar kullanılamaz</span>
                      </div>
                      <span className="text-sm text-siyah/60 shrink-0">
                        {t.event_date ? new Date(t.event_date + "T12:00:00").toLocaleDateString("tr-TR") : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Geçmiş siparişler */}
            <section className="rounded-2xl border border-siyah/10 bg-beyaz p-4 sm:p-6 shadow-sm min-w-0 overflow-hidden">
              <h2 className="font-display text-lg font-bold text-siyah break-words">Geçmiş siparişler</h2>
              <p className="mt-1 text-sm text-siyah/70 break-words">Teslim edilmiş siparişleriniz.</p>
              {(!pastOrders || pastOrders.length === 0) ? (
                <div className="mt-4 rounded-xl border border-dashed border-siyah/20 bg-siyah/[0.02] p-6 text-center">
                  <p className="text-sm text-siyah/60">Henüz teslim edilmiş siparişiniz yok.</p>
                </div>
              ) : (
                <ul className="mt-4 space-y-2 min-w-0">
                  {pastOrders.map((o) => {
                    const deliveryMethod = (o as { delivery_method?: string }).delivery_method;
                    const isStorePickup = deliveryMethod === "store_pickup";
                    return (
                      <li key={o.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-siyah/10 bg-siyah/[0.02] px-4 py-3 min-w-0">
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-siyah/80 text-sm break-words">Sipariş {(o as { order_number: string }).order_number}</span>
                          {isStorePickup && (
                            <span className="mt-1.5 inline-flex items-center rounded-md bg-siyah/10 px-2 py-0.5 text-[11px] font-medium text-siyah/70">QR üzerinde kullanıldı · Tekrar kullanılamaz</span>
                          )}
                        </div>
                        <span className="text-sm text-siyah/60 shrink-0">
                          {new Date((o as { created_at: string }).created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Hediye haklarım — rütbeden kazanılan + admin tarafından verilen hediyeler; mağaza ürünü, QR ile teslim */}
            {(giftQuota > 0 || (pendingGifts && pendingGifts.length > 0)) && (
              <section className="rounded-2xl border border-siyah/10 bg-beyaz p-4 sm:p-6 shadow-sm min-w-0 overflow-hidden">
                <h2 className="font-display text-lg font-bold text-siyah break-words">Hediye haklarım</h2>
                <p className="mt-1 text-sm text-siyah/70 break-words">
                  {giftQuota > 0
                    ? "Rütbenizden kazanılan hediyeler mağaza ürünü olarak verilir; ücretsiz, QR ile mağazadan teslim alırsınız."
                    : "Kulüpten size verilen hediyeler; mağazada bu QR ile teslim alabilirsiniz."}
                </p>
                {giftQuota > 0 && (
                  <p className="mt-2 text-sm font-medium text-siyah break-words">Bu yıl: <span className="text-bordo">{giftUsedCount ?? 0} / {giftQuota}</span> hediye kullandınız.</p>
                )}
                {pendingGifts && pendingGifts.length > 0 && (
                  <div className="mt-4 grid gap-4 grid-cols-1 sm:grid-cols-2 min-w-0">
                    {pendingGifts.map((g) => {
                      const qrCode = (g as { qr_code: string }).qr_code;
                      const qrData = `${baseUrl}/admin/teslim-al?code=${encodeURIComponent(qrCode)}`;
                      const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrData)}`;
                      const sp = (g as { store_products?: { name: string } | { name: string }[] | null }).store_products;
                      const productName = (Array.isArray(sp) ? sp[0]?.name : sp?.name) ?? "Ürün";
                      const hediyeQrUrl = `/benim-kosem/hediye-qr?code=${encodeURIComponent(qrCode)}&productName=${encodeURIComponent(productName)}`;
                      return (
                        <Link
                          key={g.id}
                          href={hediyeQrUrl}
                          className="flex items-center gap-3 sm:gap-4 rounded-xl border border-bordo/20 bg-gradient-to-br from-bordo/5 to-siyah/5 p-4 min-w-0 overflow-hidden transition-shadow hover:shadow-md"
                        >
                          <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-lg border border-siyah/10 bg-beyaz">
                            <img src={qrImgUrl} alt="Hediye QR" width={64} height={64} className="h-full w-full object-contain" />
                          </div>
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <p className="font-semibold text-siyah text-sm sm:text-base break-words">Hediye: {productName}</p>
                            <p className="mt-0.5 font-mono text-xs text-siyah/70 truncate">Kod: {qrCode}</p>
                            <p className="mt-1 text-xs text-siyah/60 break-words">Mağazada bu QR ile teslim alın.</p>
                          </div>
                          <span className="shrink-0 text-xs font-medium text-bordo">Göster</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
                {giftQuota > 0 && (giftUsedCount ?? 0) < giftQuota && (
                  <Link href="/benim-kosem/hediye-kullan" className="mt-4 inline-block rounded-lg bg-bordo px-4 py-2 text-sm font-medium text-beyaz hover:bg-bordo/90">Hediye hakkını kullan</Link>
                )}
              </section>
            )}

            {/* Favori oyuncu */}
            <section className="rounded-2xl border border-siyah/10 bg-beyaz p-4 sm:p-6 shadow-sm min-w-0 overflow-hidden">
              <h2 className="font-display text-lg font-bold text-siyah break-words">Favori Oyuncum</h2>
              <p className="mt-1 text-sm text-siyah/70 break-words">Favori oyuncun gol atınca ek puan kazanacaksın (sistem yakında aktif olacak).</p>
              <div className="mt-4 min-w-0">
                <FavoriOyuncuSec currentFavoriteId={favoritePlayerId} squad={squad} />
              </div>
              {favoritePlayer && (
                <div className="mt-4 flex items-center gap-3 sm:gap-4 rounded-xl border border-siyah/10 bg-siyah/5 p-4 min-w-0 overflow-hidden">
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-bordo text-lg sm:text-xl font-bold text-beyaz">
                    {favoritePlayer.shirt_number ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="font-semibold text-siyah text-sm sm:text-base truncate">{favoritePlayer.name}</p>
                    {favoritePlayer.position && <p className="text-sm text-siyah/70 truncate">{favoritePlayer.position}</p>}
                  </div>
                  <Link href="/kadro" className="shrink-0 text-sm font-medium text-bordo hover:underline">Kadro →</Link>
                </div>
              )}
            </section>
          </div>

          <div className="min-w-0 space-y-6">
            {/* Mevcut rütbenin avantajları (sidebar) */}
            <section className="rounded-2xl border border-siyah/10 bg-beyaz p-4 sm:p-6 shadow-sm min-w-0 overflow-hidden">
              <h2 className="font-display text-lg font-bold text-siyah break-words">Mevcut rütbenin avantajları</h2>
              {mevcutAvantajlarListe.length > 0 ? (
                <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-siyah/80 break-words">
                  {mevcutAvantajlarListe.map((h, i) => (
                    <li key={i} className="break-words">{h}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-siyah/60 break-words">Admin panelinden bu kademenin avantajları tanımlanabilir.</p>
              )}
            </section>

            {/* Hızlı işlemler + Ayarlar */}
            <section className="rounded-2xl border border-siyah/10 bg-bordo/10 p-4 sm:p-6 min-w-0 overflow-hidden">
              <h2 className="font-display text-lg font-bold text-siyah break-words">Hızlı işlemler</h2>
              <div className="mt-4 flex flex-col gap-2">
                <Link href="/benim-kosem/ayarlar" className="rounded-lg border-2 border-siyah/20 px-4 py-3 font-medium text-siyah hover:bg-siyah/5 transition-colors text-center">
                  Ayarlar
                </Link>
                <Link href="/maclar" className="rounded-lg bg-bordo px-4 py-3 font-medium text-beyaz hover:bg-bordo-dark transition-colors text-center">
                  Maçlar
                </Link>
                <Link href="/magaza" className="rounded-lg border-2 border-bordo px-4 py-3 font-medium text-bordo hover:bg-bordo/10 transition-colors text-center">
                  Mağaza
                </Link>
                <Link href="/kadro" className="rounded-lg border-2 border-siyah/20 px-4 py-3 font-medium text-siyah hover:bg-siyah/5 transition-colors text-center">
                  Kadro
                </Link>
                <Link href="/haberler" className="rounded-lg border-2 border-siyah/20 px-4 py-3 font-medium text-siyah hover:bg-siyah/5 transition-colors text-center">
                  Etkinlikler
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
