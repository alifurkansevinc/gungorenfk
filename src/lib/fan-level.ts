import { createServiceRoleClient } from "@/lib/supabase/service";

/**
 * Taraftar baremleri (mağaza, bilet, bağış) hedefe ulaştıysa bir üst seviyeye geçirir ve baremleri sıfırlar.
 * Sipariş ödemesi veya bağış sonrası çağrılır.
 */
export async function checkAndLevelUp(userId: string): Promise<{ leveledUp: boolean; newLevelId?: number }> {
  const supabase = createServiceRoleClient();

  const { data: profile, error: profileError } = await supabase
    .from("fan_profiles")
    .select("id, fan_level_id, store_spend_total, match_tickets_count, donation_total")
    .eq("user_id", userId)
    .single();

  if (profileError || !profile) return { leveledUp: false };

  const currentLevelId = profile.fan_level_id as number;
  const nextLevelId = currentLevelId + 1;

  const { data: nextLevel } = await supabase
    .from("fan_levels")
    .select("id, target_store_spend, target_tickets, target_donation")
    .eq("id", nextLevelId)
    .single();

  if (!nextLevel) return { leveledUp: false };

  const targetStore = Number(nextLevel.target_store_spend) || 0;
  const targetTickets = Number(nextLevel.target_tickets) || 0;
  const targetDonation = Number(nextLevel.target_donation) || 0;
  const storeSpend = Number(profile.store_spend_total) || 0;
  const tickets = Number(profile.match_tickets_count) || 0;
  const donation = Number(profile.donation_total) || 0;

  const reached =
    storeSpend >= targetStore && tickets >= targetTickets && donation >= targetDonation;

  if (!reached) return { leveledUp: false };

  await supabase
    .from("fan_profiles")
    .update({
      fan_level_id: nextLevelId,
      store_spend_total: 0,
      match_tickets_count: 0,
      donation_total: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  return { leveledUp: true, newLevelId: nextLevelId };
}
