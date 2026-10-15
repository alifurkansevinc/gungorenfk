import { NextRequest } from "next/server";
import { checkoutCallbackResponse } from "@/lib/iyzico-callback";

export async function GET(req: NextRequest) {
  return checkoutCallbackResponse(req, "/odeme/hata", "order_not_found");
}

export async function POST(req: NextRequest) {
  return checkoutCallbackResponse(req, "/odeme/hata", "order_not_found");
}
