import crypto from "crypto";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
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
    .eq("redemption_year", year);
  const { data: pendingGifts } = await supabase
    .from("gift_redemptions")
    .select("id, qr_code, store_products(name)")
    .eq("user_id", user.id)
    .eq("status", "pending_pickup")
    .order("created_at", { ascending: false });
  const favoritePlayerId = (profile as { favorite_player_id?: string | null }).favorite_player_id ?? null;
  const favoritePlayer = favoritePlayerId ? squad.find((p) => p.id === favoritePlayerId) : null;

  const storeSpend = Number((profile as { store_spend_total?: number }).store_spend_total ?? 0);
  const donationTotal = Number((profile as { donation_total?: number }).donation_total ?? 0);

  const { data: myTickets } = await supabase
    .from("match_tickets")
    .select("id, qr_code, match_id, event_id, stadium_seats(seat_code), matches(opponent_name, match_date, match_time, venue, home_away), news(title, event_date, event_time, event_place)")
    .eq("user_id", user.id)
    .eq("payment_status", "PAID")
    .order("created_at", { ascending: false })
    .limit(20);

  // Taraftar rozet teslim bileti: yoksa bir tane oluştur (kullanıldıktan sonra listeden düşer)
  let rozetTicket: { id: string; qr_code: string } | null = null;
  const { data: rozetRows } = await supabase
    .from("rozet_pickup_tickets")
    .select("id, qr_code")
    .eq("user_id", user.id)
    .is("used_at", null)
    .limit(1);
  if (rozetRows && rozetRows.length > 0) {
    rozetTicket = { id: rozetRows[0].id, qr_code: rozetRows[0].qr_code };
  } else {
    const serviceSupabase = createServiceRoleClient();
    const newQr = "RZ-" + crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase();
    const { data: inserted } = await serviceSupabase
      .from("rozet_pickup_tickets")
      .insert({ user_id: user.id, qr_code: newQr })
      .select("id, qr_code")
      .single();
    if (inserted) rozetTicket = { id: inserted.id, qr_code: inserted.qr_code };
  }

  // Mağazadan teslim alınacak siparişler (Store cüzdanım)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const { data: storePickupOrders } = await supabase
    .from("orders")
    .select("id, order_number, pickup_code, pickup_date, status, created_at")
    .eq("user_id", user.id)
    .eq("delivery_method", "store_pickup")
    .not("pickup_code", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);

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

  const nextTargetStore = nextLevel?.target_store_spend != null ? Number(nextLevel.target_store_spend) : 500;
  const nextTargetTickets = nextLevel?.target_tickets ?? 5;
  const nextTargetDonation = nextLevel?.target_donation != null ? Number(nextLevel.target_donation) : 100;
  const barStore = nextTargetStore > 0 ? Math.min(100, (storeSpend / nextTargetStore) * 100) : 0;
  const barTickets = nextTargetTickets > 0 ? Math.min(100, (ticketsCount / nextTargetTickets) * 100) : 0;
  const barDonation = nextTargetDonation > 0 ? Math.min(100, (donationTotal / nextTargetDonation) * 100) : 0;
  const overallBar = nextLevel ? (barStore + barTickets + barDonation) / 3 : 100;

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
    <div className="min-h-screen bg-[#f8f8f8]">
      <div className="border-b border-siyah/10 bg-siyah text-beyaz">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <nav className="text-sm text-beyaz/60">
            <Link href="/" className="hover:text-beyaz">Anasayfa</Link>
            <span className="mx-2">/</span>
            <span className="text-beyaz">Benim Köşem</span>
          </nav>
          <h1 className="font-display mt-2 text-2xl font-bold sm:text-3xl">Benim Köşem</h1>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Rozet + mevcut rütbenin avantajları */}
            <section className="rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold text-siyah">Güngören BFK Rozeti</h2>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <FanLevelBadge levelSlug={currentLevel.slug} levelName={currentLevel.name} />
              </div>
              {currentLevel.description && (
                <p className="mt-4 text-sm text-siyah/80 leading-relaxed">{currentLevel.description}</p>
              )}
              {mevcutAvantajlarListe.length > 0 && (
                <>
                  <h3 className="mt-4 text-sm font-semibold text-siyah/80">Mevcut rütbenin avantajları</h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-siyah/80">
                    {mevcutAvantajlarListe.map((madde, i) => (
                      <li key={i}>{madde}</li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            {/* Sonraki rozetin için — sonraki rütbenin avantajları + 3 barem */}
            {nextLevel && (
              <section className="rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
                <h2 className="font-display text-lg font-bold text-siyah">Sonraki rozetin için</h2>
                <p className="mt-1 text-sm text-siyah/70">Sonraki kademe: <strong>{nextLevel.name}</strong>.</p>
                {sonrakiAvantajlarListe.length > 0 && (
                  <>
                    <h3 className="mt-3 text-sm font-semibold text-siyah/80">Sonraki rütbenin avantajları</h3>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-siyah/80">
                      {sonrakiAvantajlarListe.map((madde, i) => (
                        <li key={i}>{madde}</li>
                      ))}
                    </ul>
                  </>
                )}
                <div className="mt-4 space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-siyah/80">Mağaza alışveriş baremi</span>
                      <span className="tabular-nums text-siyah/70">{storeSpend.toFixed(0)} ₺ / {nextTargetStore} ₺</span>
                    </div>
                    <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-siyah/10">
                      <div className="progress-fill h-full rounded-full bg-bordo" style={{ width: `${barStore}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-siyah/80">Maç biletleri baremi</span>
                      <span className="tabular-nums text-siyah/70">{ticketsCount} / {nextTargetTickets}</span>
                    </div>
                    <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-siyah/10">
                      <div className="progress-fill h-full rounded-full bg-bordo" style={{ width: `${barTickets}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-siyah/80">Bağış baremi</span>
                      <span className="tabular-nums text-siyah/70">{donationTotal.toFixed(0)} ₺ / {nextTargetDonation} ₺</span>
                    </div>
                    <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-siyah/10">
                      <div className="progress-fill h-full rounded-full bg-bordo" style={{ width: `${barDonation}%` }} />
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-siyah">Toplam ilerleme (sonraki rozet)</span>
                      <span className="tabular-nums text-bordo font-medium">{Math.round(overallBar)}%</span>
                    </div>
                    <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-siyah/10">
                      <div className="progress-fill progress-bar-glow h-full rounded-full bg-bordo" style={{ width: `${overallBar}%` }} />
                    </div>
                  </div>
                </div>
              </section>
            )}
            {!nextLevel && (
              <section className="rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
                <h2 className="font-display text-lg font-bold text-siyah">Sonraki rozetin için</h2>
                <p className="mt-2 text-sm text-siyah/70">En yüksek kademe (Efsane) rozetindesin.</p>
              </section>
            )}

            {/* Bilet cüzdanı */}
            <section className="rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold text-siyah">Bilet cüzdanım</h2>
              <p className="mt-1 text-sm text-siyah/70">Aldığınız maç ve etkinlik biletleri. Taraftar rozeti teslim bileti mağazada kullanıldıktan sonra listeden düşer.</p>
              {rozetTicket && (
                <div className="mt-4 flex items-center gap-4 rounded-xl border-2 border-bordo/30 bg-gradient-to-br from-bordo/5 to-siyah/5 p-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-siyah/10 bg-beyaz">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(rozetTicket.qr_code)}`}
                      alt="QR"
                      width={56}
                      height={56}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-siyah">Rozet teslim bileti</p>
                    <p className="text-sm text-siyah/70 mt-0.5">Rozetini mağazadan alabilirsin.</p>
                  </div>
                </div>
              )}
              {ticketsWithMatch.length === 0 && !rozetTicket ? (
                <div className="mt-4 rounded-xl border border-dashed border-siyah/20 bg-siyah/[0.02] p-6 text-center">
                  <p className="text-sm text-siyah/60">Henüz biletiniz yok.</p>
                  <Link href="/biletler" className="mt-3 inline-block text-sm font-medium text-bordo hover:underline">Biletler →</Link>
                </div>
              ) : ticketsWithMatch.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {ticketsWithMatch.map((t) => {
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
                        className="flex items-center gap-4 rounded-xl border border-siyah/10 bg-gradient-to-br from-siyah/5 to-bordo/5 p-4 transition-shadow hover:shadow-md"
                      >
                        {qrUrl && (
                          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-siyah/10 bg-beyaz">
                            <img src={qrUrl} alt="QR" width={56} height={56} className="h-full w-full object-contain" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-siyah truncate">{t.label}</p>
                          {t.isEvent && <span className="text-[10px] font-medium text-bordo/80 uppercase tracking-wide">Etkinlik</span>}
                          <p className="text-xs text-siyah/60 mt-0.5">{subLine}</p>
                          {t.seat_code && <p className="mt-0.5 text-xs font-medium text-bordo">Koltuk: {t.seat_code}</p>}
                        </div>
                        <span className="shrink-0 text-xs font-medium text-bordo">Göster</span>
                      </Link>
                    );
                  })}
                </div>
              ) : null}
              {(ticketsWithMatch.length > 0 || rozetTicket) && (
                <Link href="/biletler" className="mt-4 block text-center text-sm font-medium text-bordo hover:underline">Yeni bilet al →</Link>
              )}
            </section>

            {/* Store cüzdanım — mağazadan teslim alınacak siparişler, QR ile */}
            <section className="rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold text-siyah">Store cüzdanım</h2>
              <p className="mt-1 text-sm text-siyah/70">Mağazadan teslim alacağınız siparişler. Teslim alırken bu QR kodunu gösterin.</p>
              {(!storePickupOrders || storePickupOrders.length === 0) ? (
                <div className="mt-4 rounded-xl border border-dashed border-siyah/20 bg-siyah/[0.02] p-6 text-center">
                  <p className="text-sm text-siyah/60">Mağazadan teslim alacağınız siparişiniz yok.</p>
                  <Link href="/magaza" className="mt-3 inline-block text-sm font-medium text-bordo hover:underline">Mağaza →</Link>
                </div>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {storePickupOrders.map((o) => {
                    const pickupCode = (o as { pickup_code: string }).pickup_code;
                    const qrData = `${baseUrl}/admin/teslim-al?code=${encodeURIComponent(pickupCode)}`;
                    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrData)}`;
                    const pickupDate = (o as { pickup_date: string | null }).pickup_date;
                    const status = (o as { status: string }).status;
                    const isDelivered = status === "DELIVERED";
                    return (
                      <div
                        key={o.id}
                        className={`flex items-center gap-4 rounded-xl border p-4 ${isDelivered ? "border-siyah/10 bg-siyah/[0.02]" : "border-siyah/10 bg-gradient-to-br from-siyah/5 to-bordo/5"}`}
                      >
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-siyah/10 bg-beyaz">
                          <img src={qrImgUrl} alt="Teslim QR" width={64} height={64} className="h-full w-full object-contain" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-siyah">Sipariş {o.order_number}</p>
                          {pickupDate && (
                            <p className="text-xs text-siyah/60 mt-0.5">
                              Teslim tarihi: {new Date(pickupDate + "T12:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                            </p>
                          )}
                          <p className="mt-0.5 font-mono text-xs text-siyah/70">Kod: {pickupCode}</p>
                          {isDelivered && <span className="mt-1 inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Teslim alındı</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {storePickupOrders && storePickupOrders.length > 0 && (
                <Link href="/magaza" className="mt-4 block text-center text-sm font-medium text-bordo hover:underline">Mağaza →</Link>
              )}
            </section>

            {/* Hediye haklarım — rütbeden kazanılan hediye; mağaza ürünü ücretsiz, QR ile teslim */}
            {giftQuota > 0 && (
              <section className="rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
                <h2 className="font-display text-lg font-bold text-siyah">Hediye haklarım</h2>
                <p className="mt-1 text-sm text-siyah/70">Rütbenizden kazanılan hediyeler mağaza ürünü olarak verilir; ücretsiz, QR ile mağazadan teslim alırsınız.</p>
                <p className="mt-2 text-sm font-medium text-siyah">Bu yıl: <span className="text-bordo">{giftUsedCount ?? 0} / {giftQuota}</span> hediye kullandınız.</p>
                {pendingGifts && pendingGifts.length > 0 && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {pendingGifts.map((g) => {
                      const qrData = `${baseUrl}/admin/teslim-al?code=${encodeURIComponent((g as { qr_code: string }).qr_code)}`;
                      const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(qrData)}`;
                      const productName = (g as { store_products?: { name: string } | null }).store_products?.name ?? "Ürün";
                      return (
                        <div key={g.id} className="flex items-center gap-4 rounded-xl border border-bordo/20 bg-gradient-to-br from-bordo/5 to-siyah/5 p-4">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-siyah/10 bg-beyaz">
                            <img src={qrImgUrl} alt="Hediye QR" width={64} height={64} className="h-full w-full object-contain" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-siyah">Hediye: {productName}</p>
                            <p className="mt-0.5 font-mono text-xs text-siyah/70">Kod: {(g as { qr_code: string }).qr_code}</p>
                            <p className="mt-1 text-xs text-siyah/60">Mağazada bu QR ile teslim alın.</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {(giftUsedCount ?? 0) < giftQuota && (
                  <Link href="/benim-kosem/hediye-kullan" className="mt-4 inline-block rounded-lg bg-bordo px-4 py-2 text-sm font-medium text-beyaz hover:bg-bordo/90">Hediye hakkını kullan</Link>
                )}
              </section>
            )}

            {/* Favori oyuncu */}
            <section className="rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold text-siyah">Favori Oyuncum</h2>
              <p className="mt-1 text-sm text-siyah/70">Favori oyuncun gol atınca ek puan kazanacaksın (sistem yakında aktif olacak).</p>
              <div className="mt-4">
                <FavoriOyuncuSec currentFavoriteId={favoritePlayerId} squad={squad} />
              </div>
              {favoritePlayer && (
                <div className="mt-4 flex items-center gap-4 rounded-xl border border-siyah/10 bg-siyah/5 p-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-bordo text-xl font-bold text-beyaz">
                    {favoritePlayer.shirt_number ?? "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-siyah">{favoritePlayer.name}</p>
                    {favoritePlayer.position && <p className="text-sm text-siyah/70">{favoritePlayer.position}</p>}
                  </div>
                  <Link href="/kadro" className="ml-auto text-sm font-medium text-bordo hover:underline">Kadro →</Link>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            {/* Mevcut rütbenin avantajları (sidebar) */}
            <section className="rounded-2xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold text-siyah">Mevcut rütbenin avantajları</h2>
              {mevcutAvantajlarListe.length > 0 ? (
                <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-siyah/80">
                  {mevcutAvantajlarListe.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-siyah/60">Admin panelinden bu kademenin avantajları tanımlanabilir.</p>
              )}
            </section>

            {/* Hızlı işlemler + Ayarlar */}
            <section className="rounded-2xl border border-siyah/10 bg-bordo/10 p-6">
              <h2 className="font-display text-lg font-bold text-siyah">Hızlı işlemler</h2>
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
