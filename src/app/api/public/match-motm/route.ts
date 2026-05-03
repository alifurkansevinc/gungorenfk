import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { isMotmVotingOpen, type MatchMotmPublicCandidate } from "@/lib/match-motm";
import { syncMatchStatusesFromSchedule } from "@/lib/match-schedule";

type MotmMatchRow = {
  id: string;
  opponent_name: string;
  match_date: string;
  match_time: string | null;
  home_away: string;
  season: string | null;
  motm_vote_starts_at: string | null;
  motm_vote_ends_at: string | null;
};

export async function GET(req: NextRequest) {
  try {
    await syncMatchStatusesFromSchedule();
    const matchIdParam = req.nextUrl.searchParams.get("matchId")?.trim();
    const svc = createServiceRoleClient();
    const nowIso = new Date().toISOString();

    let match: MotmMatchRow | null = null;

    if (matchIdParam) {
      const { data } = await svc
        .from("matches")
        .select("id, opponent_name, match_date, match_time, home_away, season, motm_vote_starts_at, motm_vote_ends_at")
        .eq("id", matchIdParam)
        .or("is_hidden.eq.false,is_hidden.is.null")
        .maybeSingle();
      match = data as MotmMatchRow | null;
    } else {
      const { data } = await svc
        .from("matches")
        .select("id, opponent_name, match_date, match_time, home_away, season, motm_vote_starts_at, motm_vote_ends_at")
        .lte("motm_vote_starts_at", nowIso)
        .gte("motm_vote_ends_at", nowIso)
        .not("motm_vote_starts_at", "is", null)
        .not("motm_vote_ends_at", "is", null)
        .or("is_hidden.eq.false,is_hidden.is.null")
        .order("motm_vote_starts_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      match = data as MotmMatchRow | null;
    }

    if (!match) {
      return NextResponse.json({ success: true, data: null });
    }

    const votingOpen = isMotmVotingOpen({
      motm_vote_starts_at: match.motm_vote_starts_at,
      motm_vote_ends_at: match.motm_vote_ends_at,
    });

    const { data: candRows } = await svc.from("match_motm_candidates").select("squad_member_id").eq("match_id", match.id);
    const ids = [...new Set((candRows ?? []).map((r) => (r as { squad_member_id: string }).squad_member_id))];

    const tally = new Map<string, number>();
    const { data: voteRows } = await svc.from("match_motm_votes").select("squad_member_id").eq("match_id", match.id);
    for (const v of voteRows ?? []) {
      const sid = (v as { squad_member_id: string }).squad_member_id;
      tally.set(sid, (tally.get(sid) ?? 0) + 1);
    }

    let squadRows: {
      id: string;
      name: string;
      shirt_number: number | null;
      photo_url: string | null;
      position: string | null;
    }[] = [];
    if (ids.length > 0) {
      const { data: s } = await svc
        .from("squad")
        .select("id, name, shirt_number, photo_url, position")
        .in("id", ids);
      squadRows = (s ?? []) as typeof squadRows;
    }

    const order = new Map(ids.map((id, i) => [id, i]));
    const candidates: MatchMotmPublicCandidate[] = squadRows
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
      .map((p) => ({
        squadMemberId: p.id,
        name: p.name,
        shirtNumber: p.shirt_number,
        photoUrl: p.photo_url,
        position: p.position,
        votes: tally.get(p.id) ?? 0,
      }));

    const auth = await createClient();
    const {
      data: { user },
    } = await auth.auth.getUser();
    let memberEligible = false;
    let votedSquadId: string | null = null;
    if (user) {
      const { data: prof } = await auth.from("fan_profiles").select("id").eq("user_id", user.id).maybeSingle();
      memberEligible = !!prof;
      if (memberEligible) {
        const { data: v } = await svc
          .from("match_motm_votes")
          .select("squad_member_id")
          .eq("match_id", match.id)
          .eq("user_id", user.id)
          .maybeSingle();
        votedSquadId = (v as { squad_member_id?: string } | null)?.squad_member_id ?? null;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        match: {
          id: match.id,
          opponentName: match.opponent_name,
          matchDate: match.match_date,
          matchTime: match.match_time,
          homeAway: match.home_away,
          season: match.season,
          voteStartsAt: match.motm_vote_starts_at,
          voteEndsAt: match.motm_vote_ends_at,
        },
        votingOpen,
        candidates,
        memberEligible,
        votedSquadId,
      },
    });
  } catch (e) {
    console.error("match-motm GET", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Hata" },
      { status: 500 }
    );
  }
}
