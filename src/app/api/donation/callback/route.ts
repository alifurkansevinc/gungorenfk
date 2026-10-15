import { NextRequest } from "next/server";
import { checkoutCallbackResponse } from "@/lib/iyzico-callback";

export async function GET(req: NextRequest) {
  return checkoutCallbackResponse(req, "/bagis/hata", "kayit_bulunamadi");
}

export async function POST(req: NextRequest) {
  return checkoutCallbackResponse(req, "/bagis/hata", "kayit_bulunamadi");
}
