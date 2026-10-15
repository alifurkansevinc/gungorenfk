"use server";

import { revalidatePath } from "next/cache";
import { cancelServiceRequest, createServiceRequest, transitionServiceRequest } from "@/lib/order-service";
import type { ServiceRequestType } from "@/lib/order-service-shared";

function revalidateServicePaths() {
  revalidatePath("/benim-kosem");
  revalidatePath("/benim-kosem/iade-degisim");
  revalidatePath("/siparis/talep");
  revalidatePath("/admin/siparisler");
  revalidatePath("/admin/siparisler/talepler");
}

export async function submitServiceRequest(input: {
  orderNumber: string;
  orderItemId: string;
  requestType: ServiceRequestType;
  quantity: number;
  toSize?: string | null;
  reason?: string | null;
  receiptToken?: string | null;
}): Promise<{ ok: true } | { error: string }> {
  const result = await createServiceRequest(input);
  if ("error" in result) return result;
  revalidateServicePaths();
  return { ok: true };
}

export async function cancelOwnServiceRequest(
  requestId: string,
  receiptToken?: string | null
): Promise<{ ok: true } | { error: string }> {
  const result = await cancelServiceRequest(requestId, receiptToken);
  if ("error" in result) return result;
  revalidateServicePaths();
  return { ok: true };
}

export async function adminTransitionServiceRequest(input: {
  requestId: string;
  action: "approve" | "reject" | "receive" | "complete";
  adminNote?: string | null;
}): Promise<{ ok: true; message: string } | { error: string }> {
  const result = await transitionServiceRequest(input);
  if (!("error" in result)) revalidateServicePaths();
  return result;
}
