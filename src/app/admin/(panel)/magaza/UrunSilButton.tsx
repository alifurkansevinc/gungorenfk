"use client";

import { deleteProduct } from "@/app/actions/store";
import { useRouter } from "next/navigation";

export function UrunSilButton({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  async function handleDelete() {
    if (!confirm(`"${productName}" ürününü silmek istediğinize emin misiniz?`)) return;
    const res = await deleteProduct(productId);
    if (res.error) alert(res.error);
    else router.refresh();
  }
  return (
    <button type="button" onClick={handleDelete} className="text-red-600 font-medium hover:underline">
      Sil
    </button>
  );
}
