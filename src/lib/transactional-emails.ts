import type { SupabaseClient } from "@supabase/supabase-js";
import { sendMail } from "@/lib/mail";
import { getSiteUrl } from "@/lib/site-url";
import {
  BRAND,
  escapeHtml,
  formatTry,
  metaPanel,
  wrapBrandEmail,
} from "@/lib/brand-email";
import {
  SERVICE_REQUEST_STATUS_LABELS,
  SERVICE_REQUEST_TYPE_LABELS,
  type ServiceRequestStatus,
  type ServiceRequestType,
} from "@/lib/order-service-shared";

const { beyaz: BEYAZ, muted: MUTED, fontBody } = BRAND;

async function resolveUserEmail(supabase: SupabaseClient, userId: string | null | undefined): Promise<string | null> {
  if (!userId) return null;
  const { data: profile } = await supabase.from("fan_profiles").select("email").eq("user_id", userId).maybeSingle();
  const pe = typeof profile?.email === "string" ? profile.email.trim().toLowerCase() : "";
  if (pe.includes("@")) return pe;
  try {
    const { data } = await supabase.auth.admin.getUserById(userId);
    const ae = data.user?.email?.trim().toLowerCase() || "";
    if (ae.includes("@")) return ae;
  } catch {
    /* ignore */
  }
  return null;
}

function safeSend(label: string, promise: Promise<{ ok: boolean; error?: string }>): void {
  promise
    .then((r) => {
      if (!r.ok) console.warn(`[mail:${label}]`, r.error);
    })
    .catch((err) => console.error(`[mail:${label}]`, err));
}

/** Bilet satın alma onayı */
export async function sendTicketPaidEmail(supabase: SupabaseClient, ticketId: string): Promise<void> {
  try {
    const { data: ticket } = await supabase
      .from("match_tickets")
      .select("id, user_id, guest_email, guest_name, qr_code, seat_id, match_id, event_id, payment_status")
      .eq("id", ticketId)
      .maybeSingle();
    if (!ticket || ticket.payment_status !== "PAID") return;

    const to =
      (typeof ticket.guest_email === "string" && ticket.guest_email.includes("@")
        ? ticket.guest_email.trim().toLowerCase()
        : null) || (await resolveUserEmail(supabase, ticket.user_id));
    if (!to) return;

    let matchLabel = "Etkinlik bileti";
    if (ticket.match_id) {
      const { data: match } = await supabase
        .from("matches")
        .select("opponent_name, match_date, match_time, venue")
        .eq("id", ticket.match_id)
        .maybeSingle();
      if (match) {
        const date = match.match_date
          ? new Date(match.match_date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
          : "";
        const time = match.match_time ? ` · ${match.match_time}` : "";
        matchLabel = `Güngören FK vs ${match.opponent_name || "Rakip"}${date ? ` — ${date}${time}` : ""}`;
        if (match.venue) matchLabel += ` · ${match.venue}`;
      }
    } else if (ticket.event_id) {
      const { data: ev } = await supabase.from("news").select("title, event_date").eq("id", ticket.event_id).maybeSingle();
      if (ev?.title) {
        matchLabel = ev.title;
        if (ev.event_date) {
          matchLabel += ` — ${new Date(ev.event_date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}`;
        }
      }
    }

    let seatCode = "—";
    if (ticket.seat_id) {
      const { data: seat } = await supabase.from("stadium_seats").select("seat_code").eq("id", ticket.seat_id).maybeSingle();
      if (seat?.seat_code) seatCode = seat.seat_code;
    }

    const name = (ticket.guest_name || "").trim() || "Değerli taraftarımız";
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(ticket.qr_code)}`;
    const site = getSiteUrl();
    const subject = `Biletiniz hazır — ${seatCode !== "—" ? seatCode : "Güngören FK"}`;

    const bodyHtml = `
      ${metaPanel([
        { label: "Maç / etkinlik", value: matchLabel },
        { label: "Koltuk", value: seatCode, large: seatCode !== "—" },
        { label: "Bilet kodu", value: ticket.qr_code },
      ])}
      <div style="text-align:center;margin:8px 0 20px;">
        <img src="${escapeHtml(qrUrl)}" width="200" height="200" alt="Bilet QR" style="display:inline-block;width:200px;height:200px;background:#fff;border-radius:8px;padding:8px;">
        <p style="margin:12px 0 0;font-family:${fontBody};font-size:12px;color:${MUTED};">Stadyum girişinde bu QR kodu gösterin</p>
      </div>
    `;

    await sendMail({
      to,
      subject,
      html: wrapBrandEmail({
        title: subject,
        eyebrow: "Bilet",
        line1: "Biletiniz",
        line2: "hazır",
        introHtml: `Merhaba <strong style="color:${BEYAZ};font-weight:600;">${escapeHtml(name)}</strong>, ödemeniz alındı. Biletiniz aşağıda.`,
        bodyHtml,
        ctaHref: `${site}/biletler/basarili?qrCode=${encodeURIComponent(ticket.qr_code)}${seatCode !== "—" ? `&seatCode=${encodeURIComponent(seatCode)}` : ""}`,
        ctaLabel: "Bileti aç",
        preheader: `Bilet · ${seatCode} · ${ticket.qr_code}`,
      }),
      text: `Biletiniz hazır. Koltuk: ${seatCode}. Kod: ${ticket.qr_code}. ${matchLabel}`,
    });
  } catch (err) {
    console.error("[mail:ticket]", err);
  }
}

/** Bağış makbuzu */
export async function sendDonationReceiptEmail(supabase: SupabaseClient, donationId: string): Promise<void> {
  try {
    const { data: d } = await supabase
      .from("donations")
      .select("id, user_id, amount, guest_email, guest_name, receipt_number, payment_status, message")
      .eq("id", donationId)
      .maybeSingle();
    if (!d || d.payment_status !== "PAID") return;

    const to =
      (typeof d.guest_email === "string" && d.guest_email.includes("@") ? d.guest_email.trim().toLowerCase() : null) ||
      (await resolveUserEmail(supabase, d.user_id));
    if (!to) return;

    const name = (d.guest_name || "").trim() || "Değerli taraftarımız";
    const receipt = d.receipt_number || d.id.slice(0, 8).toUpperCase();
    const amount = formatTry(Number(d.amount) || 0);
    const site = getSiteUrl();
    const subject = `Bağış makbuzu — ${receipt}`;

    const bodyHtml = `
      ${metaPanel([
        { label: "Makbuz no", value: receipt, large: true },
        { label: "Tutar", value: amount },
        { label: "Tarih", value: new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) },
      ])}
      <p style="margin:0;font-family:${fontBody};font-size:14px;line-height:1.6;color:${MUTED};">
        Desteğiniz için teşekkür ederiz. Bu e-posta bağış makbuzunuzdur.
        ${d.message ? `<br><br><em style="color:rgba(255,255,255,0.4);">“${escapeHtml(String(d.message).slice(0, 200))}”</em>` : ""}
      </p>
    `;

    await sendMail({
      to,
      subject,
      html: wrapBrandEmail({
        title: subject,
        eyebrow: "Bağış",
        line1: "Teşekkürler",
        line2: "makbuzunuz",
        introHtml: `Merhaba <strong style="color:${BEYAZ};font-weight:600;">${escapeHtml(name)}</strong>, bağışınız alındı.`,
        bodyHtml,
        ctaHref: `${site}/bagis/basarili?id=${encodeURIComponent(d.id)}`,
        ctaLabel: "Makbuzu gör",
        preheader: `Bağış makbuzu ${receipt} · ${amount}`,
      }),
      text: `Bağış makbuzu ${receipt}. Tutar: ${amount}. Teşekkürler.`,
    });
  } catch (err) {
    console.error("[mail:donation]", err);
  }
}

/** İade / beden değişimi durum maili */
export async function sendServiceRequestStatusEmail(
  supabase: SupabaseClient,
  requestId: string,
  status: ServiceRequestStatus
): Promise<void> {
  try {
    // Kullanıcıya anlamlı durumlar
    if (!["ONAYLANDI", "REDDEDILDI", "TESLIM_ALINDI", "TAMAMLANDI"].includes(status)) return;

    const { data: req } = await supabase.from("order_service_requests").select("*").eq("id", requestId).maybeSingle();
    if (!req) return;

    const { data: order } = await supabase
      .from("orders")
      .select("order_number, guest_email, guest_name, user_id, shipping_address")
      .eq("id", req.order_id)
      .maybeSingle();
    if (!order) return;

    const addr = order.shipping_address as Record<string, unknown> | null;
    const to =
      (typeof order.guest_email === "string" && order.guest_email.includes("@")
        ? order.guest_email.trim().toLowerCase()
        : null) ||
      (typeof addr?.email === "string" && String(addr.email).includes("@")
        ? String(addr.email).trim().toLowerCase()
        : null) ||
      (await resolveUserEmail(supabase, order.user_id || req.user_id));
    if (!to) return;

    const { data: item } = await supabase.from("order_items").select("name, size").eq("id", req.order_item_id).maybeSingle();
    const type = req.request_type as ServiceRequestType;
    const typeLabel = SERVICE_REQUEST_TYPE_LABELS[type] || type;
    const statusLabel = SERVICE_REQUEST_STATUS_LABELS[status] || status;
    const name =
      (order.guest_name || "").trim() ||
      (typeof addr?.fullName === "string" ? addr.fullName.trim() : "") ||
      "Değerli taraftarımız";

    const sizeLine =
      type === "SIZE_EXCHANGE"
        ? `${req.from_size || "—"} → ${req.to_size || "—"}`
        : item?.size
          ? String(item.size)
          : "—";

    const line2 =
      status === "ONAYLANDI"
        ? "onaylandı"
        : status === "REDDEDILDI"
          ? "reddedildi"
          : status === "TAMAMLANDI"
            ? "tamamlandı"
            : "güncellendi";

    const note =
      status === "ONAYLANDI"
        ? type === "RETURN"
          ? "Ürünü iade için hazırlayın; süreçte bilgilendirileceksiniz."
          : "Yeni beden ayrıldı. Ürünü teslim sürecini takip edin."
        : status === "TAMAMLANDI"
          ? type === "RETURN"
            ? "İade işleminiz tamamlandı."
            : "Beden değişimi tamamlandı."
          : status === "REDDEDILDI"
            ? "Detay için destek ekibimize yazabilirsiniz."
            : "Ürününüz teslim alındı olarak işaretlendi.";

    const subject = `${typeLabel}: ${statusLabel} — ${order.order_number}`;
    const site = getSiteUrl();
    const bodyHtml = `
      ${metaPanel([
        { label: "Sipariş", value: order.order_number },
        { label: "Talep", value: typeLabel },
        { label: "Durum", value: statusLabel },
        { label: "Ürün", value: item?.name || "Ürün" },
        { label: type === "SIZE_EXCHANGE" ? "Beden" : "Mevcut beden", value: sizeLine },
      ])}
      <p style="margin:0;font-family:${fontBody};font-size:14px;line-height:1.6;color:${MUTED};">${escapeHtml(note)}</p>
    `;

    await sendMail({
      to,
      subject,
      html: wrapBrandEmail({
        title: subject,
        eyebrow: typeLabel,
        line1: "Talebiniz",
        line2,
        introHtml: `Merhaba <strong style="color:${BEYAZ};font-weight:600;">${escapeHtml(name)}</strong>, talebinizin durumu güncellendi.`,
        bodyHtml,
        ctaHref: `${site}/benim-kosem`,
        ctaLabel: "Benim Köşem",
      }),
      text: `${typeLabel} — ${statusLabel}. Sipariş: ${order.order_number}. ${note}`,
    });
  } catch (err) {
    console.error("[mail:service-request]", err);
  }
}

/** Taraftar hoş geldin */
export async function sendFanWelcomeEmail(email: string, firstName: string): Promise<void> {
  try {
    const to = email.trim().toLowerCase();
    if (!to.includes("@")) return;
    const site = getSiteUrl();
    const name = firstName.trim() || "Taraftarımız";
    const subject = "Hoş geldin — Güngören FK taraftar ailesi";
    const bodyHtml = `
      <p style="margin:0 0 16px;font-family:${fontBody};font-size:15px;line-height:1.65;color:${MUTED};">
        Artık resmi taraftarımızsın. Maçlar, mağaza, biletler ve oylamalar seni bekliyor.
      </p>
      ${metaPanel([
        { label: "Rozet", value: "Güngören BFK Fanı" },
        { label: "Sonraki adım", value: "Benim Köşem’den profilini keşfet" },
      ])}
    `;
    await sendMail({
      to,
      subject,
      html: wrapBrandEmail({
        title: subject,
        eyebrow: "Taraftar",
        line1: "Hoş geldin",
        line2: name,
        introHtml: `Kaydın tamam. Forma gibi yakışır bu aile.`,
        bodyHtml,
        ctaHref: `${site}/benim-kosem`,
        ctaLabel: "Benim Köşem",
        preheader: `Hoş geldin ${name}`,
      }),
      text: `Hoş geldin ${name}! Güngören FK taraftar ailesine katıldın. ${site}/benim-kosem`,
    });
  } catch (err) {
    console.error("[mail:welcome]", err);
  }
}

/** MOTM çekiliş talihlileri */
export async function sendMotmLotteryWinnerEmails(
  supabase: SupabaseClient,
  eventId: string,
  winners: Array<{ user_id: string; place: number; display_name: string }>
): Promise<void> {
  try {
    const { data: ev } = await supabase.from("motm_lottery_events").select("title").eq("id", eventId).maybeSingle();
    const title = ev?.title || "MOTM çekilişi";
    const site = getSiteUrl();

    for (const w of winners) {
      const to = await resolveUserEmail(supabase, w.user_id);
      if (!to) continue;
      const subject = `Tebrikler — ${title} talihlisisin`;
      const bodyHtml = `
        ${metaPanel([
          { label: "Çekiliş", value: title },
          { label: "Sıra", value: `${w.place}. talihli`, large: true },
        ])}
        <p style="margin:0;font-family:${fontBody};font-size:14px;line-height:1.6;color:${MUTED};">
          Oy verdiğin için teşekkürler. Ödül detayları için kulüp iletişime geçebilir.
        </p>
      `;
      await sendMail({
        to,
        subject,
        html: wrapBrandEmail({
          title: subject,
          eyebrow: "Çekiliş",
          line1: "Tebrikler",
          line2: "talihli",
          introHtml: `Merhaba <strong style="color:${BEYAZ};font-weight:600;">${escapeHtml(w.display_name)}</strong>, çekilişte seçildin.`,
          bodyHtml,
          ctaHref: site,
          ctaLabel: "Siteye git",
        }),
        text: `Tebrikler ${w.display_name}! ${title} — ${w.place}. talihli.`,
      });
    }
  } catch (err) {
    console.error("[mail:lottery]", err);
  }
}

/** Maçın yıldızı sonucu — oy kullanan taraftarlara */
export async function sendMotmMatchResultEmails(supabase: SupabaseClient, matchId: string): Promise<{ sent: number; error?: string }> {
  try {
    const { data: match } = await supabase
      .from("matches")
      .select("opponent_name, match_date")
      .eq("id", matchId)
      .maybeSingle();
    if (!match) return { sent: 0, error: "Maç bulunamadı." };

    const { data: votes } = await supabase
      .from("match_motm_votes")
      .select("user_id, squad_member_id")
      .eq("match_id", matchId);
    if (!votes?.length) return { sent: 0, error: "Oy yok." };

    const tally = new Map<string, number>();
    for (const v of votes as { squad_member_id: string }[]) {
      tally.set(v.squad_member_id, (tally.get(v.squad_member_id) ?? 0) + 1);
    }
    let winnerId = "";
    let max = -1;
    for (const [id, n] of tally) {
      if (n > max) {
        max = n;
        winnerId = id;
      }
    }
    const { data: player } = await supabase.from("squad").select("name, shirt_number").eq("id", winnerId).maybeSingle();
    const playerName =
      player?.shirt_number != null ? `${player.shirt_number}. ${player.name}` : player?.name || "Oyuncu";

    const matchLabel = `Güngören FK vs ${match.opponent_name || "Rakip"}`;
    const date = match.match_date
      ? new Date(match.match_date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
      : "";
    const voterIds = [...new Set((votes as { user_id: string }[]).map((v) => v.user_id))];
    const site = getSiteUrl();
    let sent = 0;

    for (const uid of voterIds) {
      const to = await resolveUserEmail(supabase, uid);
      if (!to) continue;
      const subject = `Maçın yıldızı — ${playerName}`;
      const bodyHtml = `
        ${metaPanel([
          { label: "Maç", value: `${matchLabel}${date ? ` · ${date}` : ""}` },
          { label: "Maçın yıldızı", value: playerName, large: true },
          { label: "Toplam oy", value: String(max) },
        ])}
        <p style="margin:0;font-family:${fontBody};font-size:14px;line-height:1.6;color:${MUTED};">
          Oyun için teşekkürler. Sonuç taraftar oylarıyla belirlendi.
        </p>
      `;
      const r = await sendMail({
        to,
        subject,
        html: wrapBrandEmail({
          title: subject,
          eyebrow: "Maçın yıldızı",
          line1: "Kazanan",
          line2: playerName.split(" ").slice(-1)[0] || playerName,
          introHtml: `Taraftar oylaması sonucu açıklandı.`,
          bodyHtml,
          ctaHref: site,
          ctaLabel: "Siteye git",
        }),
        text: `Maçın yıldızı: ${playerName}. ${matchLabel}`,
      });
      if (r.ok) sent += 1;
    }
    return { sent };
  } catch (err) {
    console.error("[mail:motm-result]", err);
    return { sent: 0, error: err instanceof Error ? err.message : "Hata" };
  }
}
