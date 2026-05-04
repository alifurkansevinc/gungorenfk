import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/app/admin/actions";
import {
  publishMotmLotteryToHomepageForm,
  setMotmLotteryEventMatchesForm,
  unpublishMotmLotteryFromHomepageForm,
  updateMotmLotteryEventMetaForm,
} from "@/app/actions/motm-lottery";
import { MotmLotteryApplyLastTwoForm } from "../MotmLotteryApplyLastTwoForm";
import { MotmLotteryDrawForm } from "../MotmLotteryDrawForm";
import { MotmLotteryRebuildPoolForm } from "../MotmLotteryRebuildPoolForm";
import { MotmLotteryRevertForm } from "../MotmLotteryRevertForm";

const statusLabel: Record<string, string> = {
  draft: "Taslak",
  pool_ready: "Havuz hazır",
  drawn: "Çekiliş yapıldı",
};

const okMessages: Record<string, string> = {
  meta: "Bilgiler güncellendi.",
  matches: "Kaynak maçlar kaydedildi.",
  pool: "Havuz oluşturuldu veya yenilendi.",
  draft: "Taslak aşamasına döndünüz; kaynak maçları yeniden seçebilirsiniz.",
  draw: "Çekiliş tamamlandı; sonuçlar aşağıda.",
  last2: "Son iki MOTM maçı kaynak olarak bağlandı.",
  home: "Ana sayfa bandı güncellendi.",
};

function matchLabel(m: { opponent_name: string; match_date: string; home_away: string }) {
  const vs =
    m.home_away === "home" ? `Güngören FK — ${m.opponent_name}` : `${m.opponent_name} — Güngören FK`;
  return `${m.match_date} · ${vs}`;
}

export default async function MotmLotteryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ err?: string; ok?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const supabase = await getAdminSupabase();

  const { data: ev, error: evErr } = await supabase.from("motm_lottery_events").select("*").eq("id", id).maybeSingle();
  if (evErr || !ev) notFound();

  const event = ev as {
    id: string;
    title: string;
    description: string | null;
    winner_count: number;
    status: string;
    pool_built_at: string | null;
    created_at: string;
    updated_at: string;
    show_on_homepage?: boolean | null;
  };

  const { data: links } = await supabase.from("motm_lottery_event_matches").select("match_id").eq("event_id", id);
  const selectedMatchIds = new Set((links ?? []).map((r: { match_id: string }) => r.match_id));

  const { count: poolCountRaw } = await supabase
    .from("motm_lottery_pool_members")
    .select("id", { count: "exact", head: true })
    .eq("event_id", id);
  const poolCount = poolCountRaw ?? 0;

  const { data: draw } = await supabase.from("motm_lottery_draws").select("*").eq("event_id", id).maybeSingle();

  type WinRow = { user_id: string; place: number; display_name: string | null };
  let winnersDisplay: { place: number; user_id: string; name: string; email: string }[] = [];
  if (draw) {
    const { data: wins } = await supabase
      .from("motm_lottery_winners")
      .select("user_id, place, display_name")
      .eq("draw_id", (draw as { id: string }).id)
      .order("place", { ascending: true });
    const winList = (wins ?? []) as WinRow[];
    const uids = [...new Set(winList.map((w) => w.user_id))];
    const { data: fps } =
      uids.length > 0
        ? await supabase.from("fan_profiles").select("user_id, first_name, last_name, email").in("user_id", uids)
        : { data: [] as { user_id: string; first_name: string; last_name: string; email: string }[] };
    const byUser = new Map((fps ?? []).map((p) => [p.user_id, p]));
    winnersDisplay = winList.map((w) => {
      const dn = w.display_name?.trim();
      if (dn) return { place: w.place, user_id: w.user_id, name: dn, email: "—" };
      const fp = byUser.get(w.user_id);
      const name = fp ? `${fp.first_name} ${fp.last_name}`.trim() : "—";
      const email = fp?.email ?? "—";
      return { place: w.place, user_id: w.user_id, name, email };
    });
  }

  const { data: recentMatches } = await supabase
    .from("matches")
    .select("id, opponent_name, match_date, home_away, season")
    .order("match_date", { ascending: false })
    .limit(100);

  const rmIds = (recentMatches ?? []).map((m) => (m as { id: string }).id);
  const { data: tallyRows } =
    rmIds.length > 0
      ? await supabase.from("match_motm_votes").select("match_id").in("match_id", rmIds)
      : { data: [] as { match_id: string }[] };
  const voteCountByMatch = new Map<string, number>();
  for (const r of tallyRows ?? []) {
    const mid = (r as { match_id: string }).match_id;
    voteCountByMatch.set(mid, (voteCountByMatch.get(mid) ?? 0) + 1);
  }

  const selectedRows = (recentMatches ?? []).filter((m) => selectedMatchIds.has((m as { id: string }).id));
  const wcWarning = event.status === "pool_ready" && event.winner_count > poolCount;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <Link href="/admin/maclar/motm-cekilis" className="text-sm text-bordo hover:underline">
          ← Çekiliş listesi
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-siyah">{event.title}</h1>
          <span className="rounded-full bg-siyah/10 px-3 py-1 text-xs font-medium text-siyah/80">
            {statusLabel[event.status] ?? event.status}
          </span>
        </div>
        {event.description ? <p className="mt-2 whitespace-pre-wrap text-sm text-siyah/75">{event.description}</p> : null}
        <p className="mt-2 text-xs text-siyah/55">
          Oluşturulma: {new Date(event.created_at).toLocaleString("tr-TR")} · Güncelleme:{" "}
          {new Date(event.updated_at).toLocaleString("tr-TR")}
        </p>
      </div>

      {sp.err && (
        <p className="rounded-lg bg-red-100 px-4 py-3 text-sm font-medium text-red-900">{decodeURIComponent(sp.err)}</p>
      )}
      {sp.ok && okMessages[sp.ok] && (
        <p className="rounded-lg bg-green-100 px-4 py-3 text-sm font-medium text-green-900">{okMessages[sp.ok]}</p>
      )}
      {wcWarning && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Talihli sayısı ({event.winner_count}) şu an havuzdaki kişi sayısından ({poolCount}) fazla. Çekiliş yapılamaz; ya talihli
          sayısını düşürün ya da daha fazla maç ekleyip havuzu yenileyin.
        </p>
      )}

      {event.status === "drawn" && draw && (
        <section className="rounded-xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-siyah">Çekiliş sonucu</h2>
          <p className="mt-1 text-xs text-siyah/60">
            Havuz: {(draw as { pool_size_snapshot: number }).pool_size_snapshot} kişi · Talihli:{" "}
            {(draw as { winner_count_snapshot: number }).winner_count_snapshot} · Tohum (hex):{" "}
            <code className="rounded bg-siyah/10 px-1 text-[11px]">{(draw as { random_seed_hex: string }).random_seed_hex}</code>
          </p>
          <ol className="mt-4 space-y-3">
            {winnersDisplay.map((w) => (
              <li key={w.user_id} className="flex flex-wrap items-baseline gap-2 border-b border-siyah/8 pb-3 last:border-0">
                <span className="font-display text-lg font-bold tabular-nums text-bordo">{w.place}.</span>
                <span className="font-medium text-siyah">{w.name}</span>
                <span className="text-sm text-siyah/65">{w.email}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {event.status === "drawn" && (
        <section className="rounded-xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-siyah">Ana sayfa bandı</h2>
          <p className="mt-1 text-sm text-siyah/70">
            Maçın oyuncusu şeridinin hemen altında gösterilir; talihliler etkinlik/ödül hakkı metniyle birlikte listelenir. Aynı anda
            yalnızca bir etkinlik yayınlanabilir.
          </p>
          <p className="mt-2 text-sm font-medium text-siyah">
            Durum:{" "}
            {event.show_on_homepage ? (
              <span className="text-green-800">Anasayfada yayında</span>
            ) : (
              <span className="text-siyah/60">Yayında değil</span>
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <form action={publishMotmLotteryToHomepageForm}>
              <input type="hidden" name="event_id" value={id} />
              <button
                type="submit"
                className="rounded-lg bg-bordo px-4 py-2 text-sm font-semibold text-beyaz hover:bg-bordo-dark"
              >
                Anasayfada göster
              </button>
            </form>
            <form action={unpublishMotmLotteryFromHomepageForm}>
              <input type="hidden" name="event_id" value={id} />
              <button
                type="submit"
                className="rounded-lg border border-siyah/25 px-4 py-2 text-sm font-medium text-siyah hover:bg-siyah/5"
              >
                Bandı kaldır
              </button>
            </form>
          </div>
        </section>
      )}

      {event.status === "drawn" && (
        <section className="rounded-xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-siyah">Bant metni (başlık & açıklama)</h2>
          <p className="mt-1 text-xs text-siyah/60">
            Çekiliş tamamlandı; talihli sayısı sabittir. Ana sayfada görünen başlık ve açıklamayı buradan güncelleyebilirsiniz.
          </p>
          <form action={updateMotmLotteryEventMetaForm} className="mt-4 space-y-3">
            <input type="hidden" name="event_id" value={id} />
            <div>
              <label className="block text-sm font-medium text-siyah">Başlık *</label>
              <input
                name="title"
                required
                maxLength={200}
                defaultValue={event.title}
                className="mt-1 w-full rounded-lg border border-siyah/20 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-siyah">Açıklama</label>
              <textarea
                name="description"
                rows={3}
                maxLength={2000}
                defaultValue={event.description ?? ""}
                className="mt-1 w-full rounded-lg border border-siyah/20 px-3 py-2 text-sm"
                placeholder="Ödül, etkinlik tarihi veya iletişim bilgisi…"
              />
            </div>
            <button type="submit" className="rounded-lg bg-siyah px-4 py-2 text-sm font-semibold text-beyaz hover:bg-siyah/90">
              Kaydet
            </button>
          </form>
        </section>
      )}

      {event.status !== "drawn" && (
        <>
          <section className="rounded-xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-siyah">Etkinlik ayarları</h2>
            <p className="mt-1 text-xs text-siyah/60">
              Başlık ve açıklama. <strong>Talihli sayısı</strong> havuz oluşturulduktan sonra çekilişte kaç kişinin seçileceğini
              belirler; havuz hazırsa değiştirdiğinizde çekiliş öncesi tekrar kontrol edin.
            </p>
            <form action={updateMotmLotteryEventMetaForm} className="mt-4 space-y-3">
              <input type="hidden" name="event_id" value={id} />
              <div>
                <label className="block text-sm font-medium text-siyah">Başlık *</label>
                <input
                  name="title"
                  required
                  maxLength={200}
                  defaultValue={event.title}
                  className="mt-1 w-full rounded-lg border border-siyah/20 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-siyah">Açıklama</label>
                <textarea
                  name="description"
                  rows={3}
                  maxLength={2000}
                  defaultValue={event.description ?? ""}
                  className="mt-1 w-full rounded-lg border border-siyah/20 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-siyah">Talihli sayısı *</label>
                <input
                  name="winner_count"
                  type="number"
                  min={1}
                  max={500}
                  required
                  defaultValue={event.winner_count}
                  className="mt-1 w-32 rounded-lg border border-siyah/20 px-3 py-2 text-sm tabular-nums"
                />
              </div>
              <button type="submit" className="rounded-lg bg-siyah px-4 py-2 text-sm font-semibold text-beyaz hover:bg-siyah/90">
                Kaydet
              </button>
            </form>
          </section>

          {event.status === "draft" && (
            <section className="rounded-xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-siyah">Kaynak maçlar</h2>
              <p className="mt-1 text-sm text-siyah/70">
                Havuz, <strong>haftanın oyuncusu / MOTM</strong> oylamasında seçili maçların en az birinde oy kullanan benzersiz
                üyelerden oluşur. Tipik kullanım: aşağıdaki kısayolla son iki maçı bağlayın; isterseniz listeden elle de seçebilirsiniz.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <MotmLotteryApplyLastTwoForm eventId={id} />
                <span className="text-xs text-siyah/55">MOTM oyu olan maçlar içinden en yeni iki maç.</span>
              </div>
              <form action={setMotmLotteryEventMatchesForm} className="mt-4 space-y-3">
                <input type="hidden" name="event_id" value={id} />
                <div className="max-h-[min(420px,50vh)] space-y-2 overflow-y-auto rounded-lg border border-siyah/15 p-3">
                  {(recentMatches ?? []).map((m) => {
                    const row = m as { id: string; opponent_name: string; match_date: string; home_away: string; season: string | null };
                    const cnt = voteCountByMatch.get(row.id) ?? 0;
                    return (
                      <label
                        key={row.id}
                        className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 hover:bg-siyah/[0.04]"
                      >
                        <input
                          type="checkbox"
                          name="match_id"
                          value={row.id}
                          defaultChecked={selectedMatchIds.has(row.id)}
                          className="mt-1 h-4 w-4 shrink-0 rounded border-siyah/30"
                        />
                        <span className="min-w-0 flex-1 text-sm">
                          <span className="font-medium text-siyah">{matchLabel(row)}</span>
                          {row.season ? <span className="text-siyah/50"> · {row.season}</span> : null}
                          <span className="mt-0.5 block text-xs text-siyah/55">{cnt} oy</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
                <button type="submit" className="rounded-lg bg-siyah px-4 py-2 text-sm font-semibold text-beyaz hover:bg-siyah/90">
                  Maç seçimini kaydet
                </button>
              </form>
            </section>
          )}

          {event.status !== "draft" && selectedRows.length > 0 && (
            <section className="rounded-xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-siyah">Seçili kaynak maçlar</h2>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-siyah/80">
                {selectedRows.map((m) => {
                  const row = m as { id: string; opponent_name: string; match_date: string; home_away: string };
                  return <li key={row.id}>{matchLabel(row)}</li>;
                })}
              </ul>
              <p className="mt-3 text-xs text-siyah/55">
                Maç listesini değiştirmek için önce «Taslağa dön» ile taslak aşamasına alın.
              </p>
            </section>
          )}

          <section className="rounded-xl border border-siyah/10 bg-beyaz p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-siyah">Havuz</h2>
            {event.status === "draft" && (
              <p className="mt-1 text-sm text-siyah/70">
                Maçları kaydettikten sonra havuzu oluşturun. Seçilen maçlarda oy kullanan <strong>benzersiz</strong> üyeler havuza
                yazılır.
              </p>
            )}
            {event.status === "pool_ready" && (
              <p className="mt-1 text-sm text-siyah/70">
                Havuz hazır. Yeni oylar geldiyse aynı maç listesiyle yeniden kurabilirsiniz. Çekiliş tek seferliktir ve geri alınamaz.
              </p>
            )}
            <p className="mt-3 text-sm">
              Şu an havuz: <strong className="tabular-nums text-siyah">{poolCount}</strong> üye
              {event.pool_built_at ? (
                <>
                  {" "}
                  · Son kurulum: {new Date(event.pool_built_at).toLocaleString("tr-TR")}
                </>
              ) : null}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {(event.status === "draft" || event.status === "pool_ready") && (
                <MotmLotteryRebuildPoolForm eventId={id} isRebuild={event.status === "pool_ready"} />
              )}
              {event.status === "pool_ready" && <MotmLotteryRevertForm eventId={id} />}
            </div>
          </section>

          {event.status === "pool_ready" && (
            <section className="rounded-xl border border-bordo/25 bg-bordo/[0.04] p-6">
              <h2 className="text-lg font-semibold text-siyah">Çekiliş</h2>
              <p className="mt-1 text-sm text-siyah/75">
                Fisher–Yates karıştırma ve kriptografik rastgelelik ile havuzdan sırayla talihliler seçilir. Sonuç ve tohum veritabanına
                yazılır.
              </p>
              <div className="mt-4">
                <MotmLotteryDrawForm eventId={id} poolSize={poolCount} winnerCount={event.winner_count} />
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
