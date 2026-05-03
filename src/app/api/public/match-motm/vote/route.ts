import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { isMotmVotingOpen } from "@/lib/match-motm";

const GUEST_MSG =
  "Oylamaya katılmak için lütfen önce taraftar olarak üye olun (kayıt veya giriş).";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { matchId?: string; squadMemberId?: string };
    const matchId = body.matchId?.trim();
    const squadMemberId = body.squadMemberId?.trim();
    if (!matchId || !squadMemberId) {
      return NextResponse.json({ success: false, error: "Eksik parametre." }, { status: 400 });
    }

    const auth = await createClient();
    const {
      data: { user },
    } = await auth.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: GUEST_MSG }, { status: 401 });
    }

    const { data: prof } = await auth.from("fan_profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (!prof) {
      return NextResponse.json({ success: false, error: GUEST_MSG }, { status: 403 });
    }

    const svc = createServiceRoleClient();
    const { data: match, error: mErr } = await svc
      .from("matches")
      .select("id, motm_vote_starts_at, motm_vote_ends_at")
      .eq("id", matchId)
      .maybeSingle();

    if (mErr || !match) {
      return NextResponse.json({ success: false, error: "Maç bulunamadı." }, { status: 404 });
    }

    const row = match as { motm_vote_starts_at: string | null; motm_vote_ends_at: string | null };
    if (!isMotmVotingOpen(row)) {
      return NextResponse.json({ success: false, error: "Oylama şu an kapalı." }, { status: 400 });
    }

    const { data: cand } = await svc
      .from("match_motm_candidates")
      .select("squad_member_id")
      .eq("match_id", matchId)
      .eq("squad_member_id", squadMemberId)
      .maybeSingle();

    if (!cand) {
      return NextResponse.json({ success: false, error: "Bu oyuncu aday listesinde değil." }, { status: 400 });
    }

    const { error: insErr } = await svc.from("match_motm_votes").insert({
      match_id: matchId,
      user_id: user.id,
      squad_member_id: squadMemberId,
    });

    if (insErr) {
      if (insErr.code === "23505") {
        return NextResponse.json(
          { success: false, error: "Bu maç için zaten oy kullandınız; oy değiştirilemez." },
          { status: 409 }
        );
      }
      return NextResponse.json({ success: false, error: insErr.message }, { status: 400 });
    }

    revalidatePath("/");

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("match-motm vote", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Hata" },
      { status: 500 }
    );
  }
}
