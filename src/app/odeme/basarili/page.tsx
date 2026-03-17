import { createClient } from "@/lib/supabase/server";
import { getReceiptByOrderNumber } from "@/lib/orders";
import OdemeBasariliContent from "./OdemeBasariliContent";

type Props = { searchParams: Promise<{ orderNumber?: string; levelUp?: string; token?: string }> | { orderNumber?: string; levelUp?: string; token?: string } };

export default async function OdemeBasariliPage(props: Props) {
  const params = typeof props.searchParams === "object" && "then" in props.searchParams
    ? await props.searchParams
    : props.searchParams;
  const orderNumber = params?.orderNumber ?? "";
  const levelUp = params?.levelUp === "1";
  const token = params?.token ?? null;

  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  let receipt = null;
  try {
    receipt = await getReceiptByOrderNumber(orderNumber || null, { token, userId });
  } catch {
    receipt = null;
  }

  return (
    <OdemeBasariliContent
      initialReceipt={receipt}
      orderNumber={orderNumber}
      levelUp={levelUp}
    />
  );
}
