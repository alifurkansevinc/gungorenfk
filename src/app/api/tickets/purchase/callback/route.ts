import { NextRequest } from "next/server";
import { checkoutCallbackResponse } from "@/lib/iyzico-callback";

export async function GET(req: NextRequest) {
  return checkoutCallbackResponse(req, "/biletler/hata", "bilet_bulunamadi");
}

export async function POST(req: NextRequest) {
  return checkoutCallbackResponse(req, "/biletler/hata", "bilet_bulunamadi");
}
