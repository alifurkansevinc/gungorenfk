import { NextResponse } from "next/server";
import { assertBridgeApiKey } from "@/lib/bridge/auth";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

/**
 * GET /api/bridge/transfers
 * Optaport’un transfer fotoğraflarını çekmesi için.
 * Query: direction=incoming|outgoing|all (varsayılan: all, yalnızca fotoğraflı)
 */
export async function GET(request: Request) {
  const gate = assertBridgeApiKey(request);
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.error }, { status: gate.status });
  }

  const url = new URL(request.url);
  const directionRaw = (url.searchParams.get("direction") || "all").trim().toLowerCase();
  const direction =
    directionRaw === "incoming" || directionRaw === "outgoing" ? directionRaw : "all";

  let svc;
  try {
    svc = createServiceRoleClient();
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Supabase yapılandırması eksik." },
      { status: 500 },
    );
  }

  let query = svc
    .from("transfers")
    .select(
      "id, player_name, player_image_url, position, age, from_team_name, to_team_name, direction, transfer_date, sort_order",
    )
    .not("player_image_url", "is", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (direction !== "all") {
    query = query.eq("direction", direction);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const transfers = (data ?? [])
    .map((t) => ({
      id: t.id as string,
      player_name: String(t.player_name ?? "").trim(),
      player_image_url: String(t.player_image_url ?? "").trim(),
      position: (t.position as string | null) ?? null,
      age: (t.age as number | null) ?? null,
      from_team_name: (t.from_team_name as string | null) ?? null,
      to_team_name: (t.to_team_name as string | null) ?? null,
      direction: ((t.direction as string | null) ?? "incoming") as string,
      transfer_date: (t.transfer_date as string | null) ?? null,
    }))
    .filter((t) => t.player_name && t.player_image_url && /^https?:\/\//i.test(t.player_image_url));

  return NextResponse.json({
    success: true,
    direction,
    count: transfers.length,
    transfers,
  });
}
