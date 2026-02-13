import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type ShippingSettings = {
  freeShippingThreshold: number;
  standardShippingCost: number;
  estimatedDeliveryDays: string;
};

const defaults: ShippingSettings = {
  freeShippingThreshold: 500,
  standardShippingCost: 29.9,
  estimatedDeliveryDays: "2-3",
};

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "shipping").single();
  const value = (data?.value as Partial<ShippingSettings>) ?? {};
  const settings: ShippingSettings = {
    freeShippingThreshold: Number(value.freeShippingThreshold) || defaults.freeShippingThreshold,
    standardShippingCost: Number(value.standardShippingCost) ?? defaults.standardShippingCost,
    estimatedDeliveryDays: value.estimatedDeliveryDays ?? defaults.estimatedDeliveryDays,
  };
  return NextResponse.json({ success: true, data: settings });
}
