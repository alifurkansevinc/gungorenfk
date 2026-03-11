import { getReceiptByOrderNumber } from "@/lib/orders";
import OdemeBasariliContent from "./OdemeBasariliContent";

type Props = { searchParams: Promise<{ orderNumber?: string; levelUp?: string }> | { orderNumber?: string; levelUp?: string } };

export default async function OdemeBasariliPage(props: Props) {
  const params = typeof props.searchParams === "object" && "then" in props.searchParams
    ? await props.searchParams
    : props.searchParams;
  const orderNumber = params?.orderNumber ?? "";
  const levelUp = params?.levelUp === "1";

  let receipt = null;
  try {
    receipt = await getReceiptByOrderNumber(orderNumber || null);
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
